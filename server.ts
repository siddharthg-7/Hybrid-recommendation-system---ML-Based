import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { MOVIES, INITIAL_RATINGS, USERS } from "./src/data.js";
import { 
  getHybridRecommendations, 
  getFeatureEngineering, 
  evaluateModel, 
  runKMeansUserClustering 
} from "./src/mlEngine.js";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY || "";
let gemini: GoogleGenAI | null = null;

if (geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY") {
  try {
    gemini = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI client:", err);
  }
}

// Global ratings holder - keeping state in-memory so recruiters can add ratings live
let activeRatings = [...INITIAL_RATINGS];

// MovieLens 100K cached datasets
let movielensMovies: any[] = [];
let movielensRatings: any[] = [];
let movielensUsers: any[] = [];
let isMovieLensLoading = false;
let isMovieLensLoaded = false;
let movieLensLoadError = "";

// CSV line parser for raw CSV rows with optional double quotes support
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Thread-safe loader with multiple GitHub CDNs or mirrors
async function ensureMovieLensLoaded() {
  if (isMovieLensLoaded) return;
  if (isMovieLensLoading) {
    while (isMovieLensLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    return;
  }

  isMovieLensLoading = true;
  movieLensLoadError = "";
  try {
    console.log("[MovieLens] Fetching real MovieLens 100K ratings and movies from mirrored CDNs...");

    const moviesUrls = [
      "https://raw.githubusercontent.com/senthilthyagarajan/MovieLens-Dataset/master/movies.csv",
      "https://raw.githubusercontent.com/srinivasav22/MovieLens-Dataset/master/movies.csv",
      "https://raw.githubusercontent.com/spatialcognition/MovieLens-Dataset/master/movies.csv"
    ];

    const ratingsUrls = [
      "https://raw.githubusercontent.com/senthilthyagarajan/MovieLens-Dataset/master/ratings.csv",
      "https://raw.githubusercontent.com/srinivasav22/MovieLens-Dataset/master/ratings.csv",
      "https://raw.githubusercontent.com/spatialcognition/MovieLens-Dataset/master/ratings.csv"
    ];

    let moviesCsvText = "";
    let ratingsCsvText = "";

    // Attempt downloading movies
    for (const url of moviesUrls) {
      try {
        console.log(`[MovieLens] Trying to fetch movies from ${url}`);
        const res = await fetch(url);
        if (res.ok) {
          moviesCsvText = await res.text();
          break;
        }
      } catch (err: any) {
        console.warn(`[MovieLens] Failed movies URL ${url}:`, err.message || err);
      }
    }

    // Attempt downloading ratings
    for (const url of ratingsUrls) {
      try {
        console.log(`[MovieLens] Trying to fetch ratings from ${url}`);
        const res = await fetch(url);
        if (res.ok) {
          ratingsCsvText = await res.text();
          break;
        }
      } catch (err: any) {
        console.warn(`[MovieLens] Failed ratings URL ${url}:`, err.message || err);
      }
    }

    if (!moviesCsvText || !ratingsCsvText) {
      throw new Error("Could not download ratings or movies files from any GitHub MovieLens mirror.");
    }

    // Parse Movies (expecting movieId,title,genres)
    const rawMoviesLines = moviesCsvText.split(/\r?\n/).slice(1);
    const moviesTemp: any[] = [];
    rawMoviesLines.forEach((line) => {
      if (!line.trim()) return;
      const columns = parseCSVLine(line);
      if (columns.length < 3) return;
      const id = parseInt(columns[0]);
      const titleFull = columns[1];
      const genresRaw = columns[2];

      if (isNaN(id)) return;

      // Extract release year from title, e.g., "Toy Story (1995)"
      const yearMatch = titleFull.match(/\((\d{4})\)/);
      const releaseYear = yearMatch ? parseInt(yearMatch[1]) : 1995;
      const title = titleFull.replace(/\s*\(\d{4}\)\s*$/, "").replace(/^"|"$/g, "").trim();

      const genres = genresRaw.split("|").map(g => g.trim());

      // Beautiful dynamic visual placeholder elements from Unsplash matching genres
      let imageUrl = "https://images.unsplash.com/photo-148546234645-a62644f84728?q=80&w=600&auto=format&fit=crop";
      if (genres.includes("Sci-Fi") || genres.includes("IMAX")) {
        imageUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop";
      } else if (genres.includes("Adventure") || genres.includes("Fantasy") || genres.includes("Children")) {
        imageUrl = "https://images.unsplash.com/photo-1547234935-80c7145ec969?q=80&w=600&auto=format&fit=crop";
      } else if (genres.includes("Action") || genres.includes("Thriller") || genres.includes("Crime")) {
        imageUrl = "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=600&auto=format&fit=crop";
      } else if (genres.includes("Animation") || genres.includes("Comedy")) {
        imageUrl = "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop";
      } else if (genres.includes("Drama") || genres.includes("Romance") || genres.includes("Musical")) {
        imageUrl = "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600&auto=format&fit=crop";
      }

      moviesTemp.push({
        id,
        title,
        genres,
        releaseYear,
        ratingAverage: 3.5, // dynamic average rating
        ratingCount: 0,
        synopsis: `An authentic MovieLens 100K title exploring ${genres.join(" & ")}. Recommended via SVD Matrix Factorization and cosine vector scaling.`
      });
    });

    // Parse Ratings (expecting userId,movieId,rating,timestamp)
    const rawRatingsLines = ratingsCsvText.split(/\r?\n/).slice(1);
    const ratingsTemp: any[] = [];
    const movieRatingStats: Record<number, { sum: number; count: number }> = {};

    rawRatingsLines.forEach((line) => {
      if (!line.trim()) return;
      const columns = line.split(",");
      if (columns.length < 3) return;
      const userId = parseInt(columns[0]);
      const movieId = parseInt(columns[1]);
      const rating = parseFloat(columns[2]);
      if (isNaN(userId) || isNaN(movieId) || isNaN(rating)) return;

      ratingsTemp.push({ userId, movieId, rating });

      if (!movieRatingStats[movieId]) {
        movieRatingStats[movieId] = { sum: 0, count: 0 };
      }
      movieRatingStats[movieId].sum += rating;
      movieRatingStats[movieId].count += 1;
    });

    // Re-average details
    moviesTemp.forEach((m) => {
      const stats = movieRatingStats[m.id];
      if (stats) {
        m.ratingAverage = parseFloat((stats.sum / stats.count).toFixed(2));
        m.ratingCount = stats.count;
      }
    });

    // Extract top active reviewers to list as selectable profiles
    const userRatingCounts: Record<number, number> = {};
    ratingsTemp.forEach(r => {
      userRatingCounts[r.userId] = (userRatingCounts[r.userId] || 0) + 1;
    });

    const activeUserIds = Object.keys(userRatingCounts)
      .map(Number)
      .sort((a, b) => userRatingCounts[b] - userRatingCounts[a])
      .slice(0, 40); // 40 highly active reviewers

    const personas = [
      "Sci-Fi Purist", "Cinephile Critic", "Thriller Explorer", "Retro Enthusiast", 
      "Indie Advocate", "Animation Collector", "Musical Devotee", "Drama Scholar"
    ];

    const usersTemp = activeUserIds.map((uId, idx) => {
      const p = personas[idx % personas.length];
      return {
        id: uId,
        name: `User ${uId} (${p})`,
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=mluser${uId}`
      };
    });

    movielensMovies = moviesTemp;
    movielensRatings = ratingsTemp;
    movielensUsers = usersTemp;
    isMovieLensLoaded = true;
    console.log(`[MovieLens] Parsing done! ${movielensMovies.length} movies, ${movielensRatings.length} ratings.`);
  } catch (err: any) {
    movieLensLoadError = err.message || JSON.stringify(err);
    console.error("[MovieLens] Load failure:", err);
  } finally {
    isMovieLensLoading = false;
  }
}

// Serve API routes FIRST
app.post("/api/load-movielens", async (req, res) => {
  try {
    await ensureMovieLensLoaded();
    if (movieLensLoadError) {
      return res.status(500).json({ error: movieLensLoadError });
    }
    res.json({
      success: true,
      moviesCount: movielensMovies.length,
      ratingsCount: movielensRatings.length,
      usersCount: movielensUsers.length,
      users: movielensUsers,
      popularMovies: [...movielensMovies].sort((a, b) => b.ratingCount - a.ratingCount).slice(0, 100)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || err });
  }
});

// Fetch user dynamic ratings directly on dataset toggling
app.post("/api/user-ratings", (req, res) => {
  const userId = parseInt(req.body.userId);
  const datasetType = req.body.datasetType || "curated";
  if (datasetType === "movielens100k" && isMovieLensLoaded) {
    const ratings = movielensRatings.filter(r => r.userId === userId);
    res.json({ ratings });
  } else {
    const ratings = activeRatings.filter(r => r.userId === userId);
    res.json({ ratings });
  }
});

// 1. Reset ratings to original subset state
app.post("/api/reset", (req, res) => {
  const datasetType = req.body.datasetType || "curated";
  if (datasetType === "movielens100k") {
    res.json({ success: true, message: "Kaggle MovieLens dataset cannot be reset in-memory." });
  } else {
    activeRatings = [...INITIAL_RATINGS];
    res.json({ success: true, message: "Ratings reset to prefolded MovieLens 100K subset state." });
  }
});

// 2. Fetch movies and user-specific ratings
app.post("/api/recommendations", (req, res) => {
  const userId = req.body.userId ? parseInt(req.body.userId) : 101;
  const userCustomRatings = req.body.customRatings || [];
  const datasetType = req.body.datasetType || "curated";
  const useMovieLens = datasetType === "movielens100k" && isMovieLensLoaded;

  const currentMovies = useMovieLens ? movielensMovies : MOVIES;
  const currentRatings = useMovieLens ? movielensRatings : activeRatings;

  // Filter current system ratings for this user and map/override dynamic ratings
  const userRatings = userCustomRatings.length > 0 
    ? userCustomRatings 
    : currentRatings.filter((r) => r.userId === userId);

  // Combine latest custom ratings with other user records
  const evaluationRatings = currentRatings.filter((r) => r.userId !== userId).concat(userRatings);

  // Run Hybrid scoring
  const collWeight = req.body.collaborativeWeight !== undefined ? parseFloat(req.body.collaborativeWeight) : 0.6;
  const recommendations = getHybridRecommendations(userId, userRatings, evaluationRatings, currentMovies, collWeight);

  // Run feature engineering
  const features = getFeatureEngineering(userId, userRatings, currentMovies);

  res.json({
    userId,
    recommendations: recommendations.slice(0, 10), // return top 10
    features,
    allMoviesWatchedCount: userRatings.length
  });
});

// 3. User Clustering Nodes
app.post("/api/clustering", (req, res) => {
  const userId = req.body.userId ? parseInt(req.body.userId) : 101;
  const userCustomRatings = req.body.customRatings || [];
  const datasetType = req.body.datasetType || "curated";
  const useMovieLens = datasetType === "movielens100k" && isMovieLensLoaded;

  const currentMovies = useMovieLens ? movielensMovies : MOVIES;
  const currentRatings = useMovieLens ? movielensRatings : activeRatings;
  const currentUsers = useMovieLens ? movielensUsers : USERS;

  const userRatings = userCustomRatings.length > 0 
    ? userCustomRatings 
    : currentRatings.filter((r) => r.userId === userId);

  // Combine
  const evaluationRatings = currentRatings.filter((r) => r.userId !== userId).concat(userRatings);
  const clusters = runKMeansUserClustering(userId, userRatings, evaluationRatings, currentMovies, 4, currentUsers);

  res.json({ clusters });
});

// 4. Model Evaluation metrics
app.post("/api/evaluation", (req, res) => {
  const userId = req.body.userId ? parseInt(req.body.userId) : 101;
  const userCustomRatings = req.body.customRatings || [];
  const datasetType = req.body.datasetType || "curated";
  const useMovieLens = datasetType === "movielens100k" && isMovieLensLoaded;

  const currentMovies = useMovieLens ? movielensMovies : MOVIES;
  const currentRatings = useMovieLens ? movielensRatings : activeRatings;

  const userRatings = userCustomRatings.length > 0 
    ? userCustomRatings 
    : currentRatings.filter((r) => r.userId === userId);

  const evaluationRatings = currentRatings.filter((r) => r.userId !== userId).concat(userRatings);
  const metrics = evaluateModel(userId, userRatings, evaluationRatings, currentMovies);

  res.json({ metrics });
});

// 5. Gemini Explanation Endpoint
app.post("/api/explain", async (req, res) => {
  const { movieTitle, movieGenres, movieSynopsis, userProfile, scores } = req.body;

  if (!gemini) {
    return res.status(200).json({
      explanation: `**[DEMO MODE]** Gemini API explanation could not be completed because no valid \`GEMINI_API_KEY\` was parsed in the Settings secrets. 

      **Simulated Mathematical Analysis**:
      * **Content Similarity** (${Math.round(scores.content * 100)}%): Matches your interest in the **${userProfile.favoriteGenre}** genre ecosystem.
      * **Collaborative Predictor** (${Math.round(scores.cf * 100)}%): Predicted rating is **${scores.predictedRating.toFixed(1)}/5.0** stars based on other Cinephiles matching your taste.
      * **Hybrid Fusion Score**: **${scores.hybrid.toFixed(2)}** (Weight: 60% Collaborative Filtering, 40% TF-IDF Cosine Similarity).`
    });
  }

  const prompt = `
  You are an expert explainable recommendation advisor integrated into a Personalized Hybrid Recommendation System.
  Explain why the movie "${movieTitle}" was recommended to user.
  
  Movie Details:
  - Genres: ${movieGenres.join(", ")}
  - Overview: ${movieSynopsis}

  Active User Model Profile:
  - Favorite Genre of this user: ${userProfile.favoriteGenre}
  - User's overall rated average: ${userProfile.averageRating} out of 5 stars
  - Movies watched: ${userProfile.moviesWatched}
  - Hybrid Score Breakdown:
    * Collaborative Predictor Score: ${scores.cf.toFixed(2)} / 1.0 (Neighbors similarity)
    * Content-Based Score (TF-IDF Cosine Similarity): ${scores.content.toFixed(2)} / 1.0
    * Target Predicted Rating: ${scores.predictedRating.toFixed(1)} / 5.0 stars
    * Combined Final Hybrid Fusion Score: ${scores.hybrid.toFixed(2)} / 1.0

  Draft a compelling, highly scannable, friendly, and analytical explanation detailing why they will love "${movieTitle}".
  Break down the explanation into two quick visual bullet themes:
  1. The "Algorithmic Connection" (referencing TF-IDF matching for genres like ${movieGenres.join(", ")} or peer cinephile reviews).
  2. The "Therapeutic Narrative fit" (referencing the synopsis or why the premise fits their profile).
  Ensure you maintain brief readability (around 120-140 words). Speak directly to the user (use 'you').
  Do NOT use markdown headers like h1/h2, instead use clean bullet-points and bold tags.
  `;

  let responseText = "";
  let lastError: any = null;

  // Let's attempt with a retry and model fallback strategy for robustness against transient 503s
  const attempts = [
    { model: "gemini-3.1-flash-lite", delay: 0 }, // try the highly available, fast lightweight model first
    { model: "gemini-flash-latest", delay: 500 }, // try stable-alias flash mapping to robust cluster
    { model: "gemini-3.5-flash", delay: 1000 } // fallback to primary text model
  ];

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    try {
      if (attempt.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, attempt.delay));
      }
      
      console.log(`[Gemini Explanation] Requesting explanation using model="${attempt.model}" (Attempt ${i + 1}/${attempts.length})...`);
      const response = await gemini.models.generateContent({
        model: attempt.model,
        contents: prompt,
        config: {
          systemInstruction: "You are a professional explainable recommendation assistant recommending movies. Be clear, succinct, positive, and analytically sound."
        }
      });

      if (response && response.text) {
        responseText = response.text;
        break; // Success!
      }
    } catch (err: any) {
      console.warn(`[Gemini Explanation] Attempt ${i + 1} with model="${attempt.model}" failed:`, err.message || err);
      lastError = err;
    }
  }

  if (responseText) {
    res.json({ explanation: responseText });
  } else {
    const errorMsg = lastError ? lastError.message : "All attempts failed.";
    console.warn("Gemini Explanation API experienced a failure (falling back gracefully):", errorMsg);
    
    const fallbackText = `**[DEMO FALLBACK]** Live Gemini query couldn't be completed (API high demand or key reported as idle/invalid). Here is the robust algorithmic breakdown for your recommendation:

    * **Algorithmic Connection**: Designed Content-Based TF-IDF matching registers a strong **${(scores.content * 100).toFixed(0)}%** movie affinity alignment on genres like ${movieGenres.join(", ")} based on your love of the **${userProfile.favoriteGenre}** ecosystem.
    * **Cinephile Collaboration**: Our SVD matrix factorization algorithm predicted a **${scores.predictedRating.toFixed(1)}★** rating for "${movieTitle}".
    * **Therapeutic Narrative Fit**: Combining your profile's mean rating bias of **${userProfile.averageRating}★** with your ${userProfile.moviesWatched} completed ratings, the combined Hybrid Fusion index stands at **${scores.hybrid.toFixed(3)}** out of 1.0.`;
    
    res.json({ 
      explanation: fallbackText,
      warning: errorMsg
    });
  }
});

// Phase 9 API Endpoints (as specified in guidelines)
app.get("/recommend/:user_id", (req, res) => {
  const userId = parseInt(req.params.user_id) || 101;
  const userRatings = activeRatings.filter((r) => r.userId === userId);
  const recommendations = getHybridRecommendations(userId, userRatings, activeRatings, MOVIES, 0.6);
  res.json({
    userId,
    recommendations: recommendations.slice(0, 10).map((r) => ({
      movieId: r.movie.id,
      title: r.movie.title,
      genres: r.movie.genres,
      predictedRating: parseFloat(r.predictedRating.toFixed(2)),
      hybridScore: parseFloat(r.hybridScore.toFixed(3))
    }))
  });
});

app.get("/movie/:movie_id", (req, res) => {
  const movieId = parseInt(req.params.movie_id);
  const movie = MOVIES.find((m) => m.id === movieId);
  if (!movie) {
    return res.status(404).json({ error: "Movie not found" });
  }
  res.json(movie);
});

app.post("/rate", (req, res) => {
  const { userId, movieId, rating } = req.body;
  if (!userId || !movieId || rating === undefined) {
    return res.status(400).json({ error: "Missing required fields: userId, movieId, rating." });
  }

  const parsedUserId = parseInt(userId);
  const parsedMovieId = parseInt(movieId);
  const parsedRating = parseFloat(rating);

  if (isNaN(parsedUserId) || isNaN(parsedMovieId) || isNaN(parsedRating)) {
    return res.status(400).json({ error: "Invalid data type for fields." });
  }

  const index = activeRatings.findIndex((r) => r.userId === parsedUserId && r.movieId === parsedMovieId);
  if (index > -1) {
    activeRatings[index].rating = parsedRating;
  } else {
    activeRatings.push({ userId: parsedUserId, movieId: parsedMovieId, rating: parsedRating });
  }

  res.json({
    success: true,
    message: "Rating saved successfully",
    totalRatings: activeRatings.length
  });
});

app.post("/feedback", (req, res) => {
  const { userId, feedback } = req.body;
  res.json({
    success: true,
    message: "Feedback submitted successfully",
    stored: { userId: parseInt(userId) || 101, feedback: feedback || "" }
  });
});

// Configure Vite or production static file serving
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets from dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening at http://localhost:${PORT}`);
  });
};

if (!process.env.VERCEL) {
  startServer();
}

export default app;
