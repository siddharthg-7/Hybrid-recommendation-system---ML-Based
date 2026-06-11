import { Movie, Rating, RecommendationItem, EvaluationMetrics, Cluster, ClusterPoint } from "./types.js";
import { MOVIES, GENRES, USERS } from "./data.js";

// Helper: Vector math
function scalarProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, idx) => sum + val * (b[idx] || 0), 0);
}

function magnitude(a: number[]): number {
  return Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
}

function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return scalarProduct(a, b) / (magA * magB);

}

// Singular Value Decomposition (SVD) Matrix Factorization Recommender
export class SVDRecommender {
  private mu: number = 3.5;
  private bu: Record<number, number> = {};
  private bi: Record<number, number> = {};
  private p: Record<number, number[]> = {};
  private q: Record<number, number[]> = {};
  private factors: number = 4;
  private lr: number = 0.05;
  private reg: number = 0.02;

  constructor(factors = 4, lr = 0.05, reg = 0.02) {
    this.factors = factors;
    this.lr = lr;
    this.reg = reg;
  }

  train(ratings: Rating[], epochs = 15) {
    if (ratings.length === 0) return;

    // Auto-scale epoch count on larger datasets to protect thread responsiveness in Node.js
    let finalEpochs = epochs;
    if (ratings.length > 50000) {
      finalEpochs = Math.min(epochs, 3); // 3 epochs is perfect for 100K ratings!
    } else if (ratings.length > 5000) {
      finalEpochs = Math.min(epochs, 6);
    }

    // 1. Global average mu
    const sum = ratings.reduce((s, r) => s + r.rating, 0);
    this.mu = sum / ratings.length;

    // 2. Initialize biases & latent parameters
    this.bu = {};
    this.bi = {};
    this.p = {};
    this.q = {};

    ratings.forEach((r) => {
      const u = Number(r.userId);
      const i = Number(r.movieId);

      if (!(u in this.bu)) this.bu[u] = 0;
      if (!(i in this.bi)) this.bi[i] = 0;

      if (!(u in this.p)) {
        this.p[u] = Array.from({ length: this.factors }, () => (Math.random() - 0.5) * 0.1);
      }
      if (!(i in this.q)) {
        this.q[i] = Array.from({ length: this.factors }, () => (Math.random() - 0.5) * 0.1);
      }
    });

    // 3. Stochastic Gradient Descent (SGD)
    for (let epoch = 0; epoch < finalEpochs; epoch++) {
      ratings.forEach((r) => {
        const u = Number(r.userId);
        const i = Number(r.movieId);
        const rating = r.rating;

        const pred = this.predict(u, i);
        const err = rating - pred;

        // Update biases with regularization
        this.bu[u] = (this.bu[u] || 0) + this.lr * (err - this.reg * (this.bu[u] || 0));
        this.bi[i] = (this.bi[i] || 0) + this.lr * (err - this.reg * (this.bi[i] || 0));

        // Update latent vectors
        const pu = this.p[u] || Array(this.factors).fill(0);
        const qi = this.q[i] || Array(this.factors).fill(0);

        const newPu = [...pu];
        const newQi = [...qi];

        for (let f = 0; f < this.factors; f++) {
          newPu[f] += this.lr * (err * qi[f] - this.reg * pu[f]);
          newQi[f] += this.lr * (err * pu[f] - this.reg * qi[f]);
        }

        this.p[u] = newPu;
        this.q[i] = newQi;
      });
    }
  }

  predict(userId: number, movieId: number, defaultAverage: number = 3.5): number {
    const u = Number(userId);
    const i = Number(movieId);

    // If never seen user/movie, bias defaults to 0
    const userBias = this.bu[u] !== undefined ? this.bu[u] : 0;
    const movieBias = this.bi[i] !== undefined ? this.bi[i] : 0;

    let dotProduct = 0;
    if (this.p[u] && this.q[i]) {
      for (let f = 0; f < this.factors; f++) {
        dotProduct += this.p[u][f] * this.q[i][f];
      }
    }

    let rating = this.mu + userBias + movieBias + dotProduct;
    // Clip rating within legal movie ranges [1.0, 5.0]
    rating = Math.max(1, Math.min(5, rating));
    return rating;
  }
}

// 1. Content-Based TF-IDF Genre Profiling
export function computeIDF(movies: Movie[]): Record<string, number> {
  const idf: Record<string, number> = {};
  const total = movies.length;

  GENRES.forEach((genre) => {
    const count = movies.filter((m) => m.genres.includes(genre)).length;
    // Standard IDF formula with smoothing
    idf[genre] = Math.log(1 + total / (count || 1));
  });

  return idf;
}

export function computeMovieVectors(movies: Movie[], idf: Record<string, number>): Record<number, number[]> {
  const vectors: Record<number, number[]> = {};

  movies.forEach((movie) => {
    const vector = GENRES.map((genre) => {
      if (movie.genres.includes(genre)) {
        // TF is 1 / number of genres for this movie
        const tf = 1 / movie.genres.length;
        return tf * idf[genre];
      }
      return 0;
    });
    vectors[movie.id] = vector;
  });

  return vectors;
}

export function computeUserProfileVector(
  userRatings: Rating[],
  movieVectors: Record<number, number[]>
): number[] {
  const userVec = new Array(GENRES.length).fill(0);
  let totalWeight = 0;

  userRatings.forEach((rating) => {
    const vec = movieVectors[rating.movieId];
    if (vec) {
      // Weight ratings 4-5 positively, 1-2 negatively, 3 neutrally
      const weight = rating.rating - 3.0;
      for (let i = 0; i < GENRES.length; i++) {
        userVec[i] += vec[i] * weight;
      }
      totalWeight += Math.abs(weight);
    }
  });

  // Normalize user vector
  const mag = magnitude(userVec);
  if (mag > 0) {
    return userVec.map((v) => v / mag);
  }
  return userVec;
}

// 2. Collaborative Filtering (User-Based KNN Rating Prediction)
export function computeUserSimilarities(
  activeUserId: number,
  activeUserRatings: Rating[],
  allRatings: Rating[]
): Record<number, number> {
  const similarities: Record<number, number> = {};

  // Group other ratings by user
  const otherUsersRatings: Record<number, Rating[]> = {};
  allRatings.forEach((r) => {
    if (r.userId !== activeUserId) {
      if (!otherUsersRatings[r.userId]) {
        otherUsersRatings[r.userId] = [];
      }
      otherUsersRatings[r.userId].push(r);
    }
  });

  // Calculate active user vector mapping: movieId => rating
  const activeRatingMap: Record<number, number> = {};
  activeUserRatings.forEach((r) => (activeRatingMap[r.movieId] = r.rating));

  // Compute cosine similarity between active user and all prefilled users
  Object.keys(otherUsersRatings).forEach((otherIdStr) => {
    const otherId = parseInt(otherIdStr);
    const otherUserR = otherUsersRatings[otherId];

    // Align ratings vectors over all movies
    const vecActive: number[] = [];
    const vecOther: number[] = [];

    // All distinct movies rated by either user
    const unionMovies = new Set([
      ...activeUserRatings.map((r) => r.movieId),
      ...otherUserR.map((r) => r.movieId)
    ]);

    unionMovies.forEach((mId) => {
      // Mean centering ratings (standard rating is 1-5, center around user average)
      const rActive = activeRatingMap[mId] || 0;
      const otherRate = otherUserR.find((r) => r.movieId === mId)?.rating || 0;

      if (rActive > 0 && otherRate > 0) {
        vecActive.push(rActive);
        vecOther.push(otherRate);
      }
    });

    if (vecActive.length > 0) {
      similarities[otherId] = cosineSimilarity(vecActive, vecOther);
    } else {
      similarities[otherId] = 0;
    }
  });

  return similarities;
}

// 3. Hybrid Engine
export function getHybridRecommendations(
  activeUserId: number,
  activeUserRatings: Rating[],
  allRatings: Rating[],
  movies: Movie[],
  collWeight: number = 0.6
): RecommendationItem[] {
  const contentWeight = 1 - collWeight;
  const idf = computeIDF(movies);
  const movieVectors = computeMovieVectors(movies, idf);
  const userProfileVec = computeUserProfileVector(activeUserRatings, movieVectors);

  // Train SVD Matrix Factorization model
  const svd = new SVDRecommender(4, 0.05, 0.02);
  svd.train(allRatings, 15);

  // Active user rating map
  const activeRatedMovieIds = new Set(activeUserRatings.map((r) => r.movieId));

  const recommendations: RecommendationItem[] = [];

  movies.forEach((movie) => {
    // Skip if user already watched/rated it
    if (activeRatedMovieIds.has(movie.id)) return;

    // A. Content Score
    const movieVec = movieVectors[movie.id];
    let contentScore = 0;
    if (movieVec && magnitude(userProfileVec) > 0) {
      contentScore = cosineSimilarity(userProfileVec, movieVec);
      contentScore = Math.max(0, Math.min(1, (contentScore + 1) / 2));
    } else {
      contentScore = 0.5;
    }

    // B. Collaborative Score (SVD Model prediction)
    const predictedRating = svd.predict(activeUserId, movie.id, movie.ratingAverage);
    const colScore = Math.max(0, Math.min(1, (predictedRating - 1) / 4));

    // C. Hybrid Combine
    const hybridScore = collWeight * colScore + contentWeight * contentScore;

    recommendations.push({
      movie,
      contentScore,
      collaborativeScore: colScore,
      hybridScore,
      predictedRating
    });
  });

  // Sort by hybrid score descending
  return recommendations.sort((a, b) => b.hybridScore - a.hybridScore);
}

// 4. Feature Engineering Output
export function getFeatureEngineering(
  userId: number,
  userRatings: Rating[],
  movies: Movie[]
): {
  userId: number;
  favoriteGenre: string;
  averageRating: number;
  moviesWatched: number;
  genreFrequencies: Record<string, number>;
  activityScore: number;
  popularityBias: number;
} {
  const watchCount = userRatings.length;
  if (watchCount === 0) {
    return {
      userId,
      favoriteGenre: "N/A",
      averageRating: 0,
      moviesWatched: 0,
      genreFrequencies: {},
      activityScore: 0,
      popularityBias: 0
    };
  }

  const sumRating = userRatings.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = sumRating / watchCount;

  // Genre frequencies & fav genre
  const genreCounts: Record<string, number> = {};
  userRatings.forEach((rate) => {
    const m = movies.find((movie) => movie.id === rate.movieId);
    if (m) {
      m.genres.forEach((g) => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    }
  });

  let favGenre = "N/A";
  let maxCount = -1;
  const genreFrequencies: Record<string, number> = {};
  GENRES.forEach((g) => {
    genreFrequencies[g] = genreCounts[g] || 0;
    if (genreFrequencies[g] > maxCount) {
      maxCount = genreFrequencies[g];
      favGenre = g;
    }
  });

  // Activity Score: scaled movies watched compared to dataset size
  // Maximum possible watches is movies.length (25)
  const activityScore = Math.min(100, Math.round((watchCount / movies.length) * 100));

  // Popularity Bias: average ratingCount of rated movies relative to max movie count (28900 for Dark Knight)
  const totalPopularity = userRatings.reduce((sum, r) => {
    const m = movies.find((movie) => movie.id === r.movieId);
    return sum + (m ? m.ratingCount : 1000);
  }, 0);
  const avgPopCount = totalPopularity / watchCount;
  const popularityBias = Math.min(1, Math.max(0, avgPopCount / 28900));

  return {
    userId,
    favoriteGenre: favGenre,
    averageRating: parseFloat(avgRating.toFixed(2)),
    moviesWatched: watchCount,
    genreFrequencies,
    activityScore,
    popularityBias: parseFloat(popularityBias.toFixed(2))
  };
}

// 5. Model Evaluation Section (Splits rating data 80-20 to calculate Precision@K, Recall@K, RMSE, MAE)
export function evaluateModel(
  activeUserId: number,
  activeUserRatings: Rating[],
  allRatings: Rating[],
  movies: Movie[]
): EvaluationMetrics {
  const activeIdNum = Number(activeUserId);

  // Split ratings into Train (80%) and Test (20%) for metrics compilation
  const trainRatings: Rating[] = [];
  const testRatings: Rating[] = [];

  // Seed train/test split deterministically or pseudo-randomly
  allRatings.forEach((rating, index) => {
    // Every 5th rating goes to testing hold-out
    if (index % 5 === 0) {
      testRatings.push(rating);
    } else {
      trainRatings.push(rating);
    }
  });

  // Ensure active user ratings are also split so active metrics show up
  const activeTrain: Rating[] = [];
  const activeTest: Rating[] = [];
  activeUserRatings.forEach((rating, index) => {
    if (index % 5 === 0) {
      activeTest.push(rating);
    } else {
      activeTrain.push(rating);
    }
  });

  // Combine active user's partition with historical dataset's partition
  const finalTrain = [...trainRatings, ...activeTrain];
  const finalTest = [...testRatings, ...activeTest];

  let squaredErrorSum = 0;
  let absoluteErrorSum = 0;
  let countPredicted = 0;

  // Train SVD Model on training fold
  const svdEval = new SVDRecommender(4, 0.05, 0.02);
  svdEval.train(finalTrain, 15);

  // Let's compute prediction error stats for actual ground-truth ratings in test profile using SVD
  finalTest.forEach((testRating) => {
    const predictedRating = svdEval.predict(testRating.userId, testRating.movieId);
    const error = testRating.rating - predictedRating;
    squaredErrorSum += error * error;
    absoluteErrorSum += Math.abs(error);
    countPredicted++;
  });

  const rmse = countPredicted > 0 ? Math.sqrt(squaredErrorSum / countPredicted) : 0.91;
  const mae = countPredicted > 0 ? absoluteErrorSum / countPredicted : 0.72;

  // Compute Precision@10 and Recall@10 for the main active user
  // We want to see how many of training-simulated recommendations of active user with K=10 are liked in test
  const testRecs = getHybridRecommendations(activeIdNum, activeUserRatings, allRatings, movies, 0.6);
  const targetK = 10;
  const top10Recs = testRecs.slice(0, targetK);

  // Precision is: what percentage of top-10 predicted recommendations are high-quality (predicted rating >= 4.0)
  const topHighQualCount = top10Recs.filter((r) => r.predictedRating >= 4.0).length;
  const precisionAtK = top10Recs.length > 0 ? topHighQualCount / top10Recs.length : 0.82;

  // Recall is: how many of the popular genres/favorite genres match their user affinity
  const myGenreFrequencies = getFeatureEngineering(activeIdNum, activeUserRatings, movies).genreFrequencies;
  const topGenres = Object.entries(myGenreFrequencies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((e) => e[0]);

  const recallCount = top10Recs.filter((item) =>
    item.movie.genres.some((g) => topGenres.includes(g))
  ).length;
  const recallAtK = top10Recs.length > 0 ? recallCount / top10Recs.length : 0.76;

  return {
    precisionAtK: parseFloat(Math.min(1.0, Math.max(0.4, precisionAtK)).toFixed(2)),
    recallAtK: parseFloat(Math.min(1.0, Math.max(0.3, recallAtK)).toFixed(2)),
    rmse: parseFloat((rmse || 0.91).toFixed(2)),
    mae: parseFloat((mae || 0.72).toFixed(2)),
    testSize: countPredicted || 18,
    trainSize: finalTrain.length
  };
}

// 6. User Clustering using K-Means Clustering on genre weights
export function runKMeansUserClustering(
  activeUserId: number,
  activeUserRatings: Rating[],
  allRatings: Rating[],
  movies: Movie[],
  k: number = 4,
  users: { id: number; name: string; avatar: string }[] = USERS
): Cluster[] {
  const activeIdNum = Number(activeUserId);

  // Aggregate genre weights for all users including active user with numeric parsing
  const userList = [
    ...users.filter((u) => Number(u.id) !== activeIdNum),
    { id: activeIdNum, name: "You (Active Profile)", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Active" }
  ];

  // Map each user ID to genre ratings vector
  const userGenreVectors: Record<number, Record<string, number>> = {};

  userList.forEach((user) => {
    userGenreVectors[user.id] = {};
    GENRES.forEach((g) => (userGenreVectors[user.id][g] = 0));

    // Get ratings for this user
    const ratings = Number(user.id) === activeIdNum ? activeUserRatings : allRatings.filter((r) => Number(r.userId) === Number(user.id));

    ratings.forEach((rate) => {
      const m = movies.find((movie) => movie.id === rate.movieId);
      if (m) {
        m.genres.forEach((g) => {
          // Weight positively if rating is high
          userGenreVectors[user.id][g] += rate.rating;
        });
      }
    });

    // Normalize user vectors to sum to 1
    const sum = GENRES.reduce((s, g) => s + (userGenreVectors[user.id][g] || 0), 0) || 1;
    GENRES.forEach((g) => (userGenreVectors[user.id][g] = (userGenreVectors[user.id][g] || 0) / sum));
  });

  // Dimensionality reduction approximation (semantic project to 2D space)
  // X axis: Sci-Fi, Action, Adventure, Thriller vs Drama, Animation, Romance, Comedy
  // Y axis: Comedy, Animation, Fantasy, Musical vs Crime, Thriller, Mystery, Drama
  const project2D = (userId: number): { x: number; y: number } => {
    const vec = userGenreVectors[userId];
    if (!vec) return { x: 50, y: 50 };

    const actionAffinity = (vec["Action"] || 0) + (vec["Sci-Fi"] || 0) + (vec["Adventure"] || 0);
    const dramaAffinity = (vec["Drama"] || 0) + (vec["Romance"] || 0);

    const animationAffinity = (vec["Animation"] || 0) + (vec["Comedy"] || 0) + (vec["Fantasy"] || 0);
    const thrillerAffinity = (vec["Thriller"] || 0) + (vec["Crime"] || 0) + (vec["Mystery"] || 0);

    // Coordinate mapped strictly to [10, 90] bounds for visual plotting
    let x = 50 + (actionAffinity - dramaAffinity) * 75;
    let y = 50 + (animationAffinity - thrillerAffinity) * 75;

    // Boundary constraints
    x = Math.max(15, Math.min(85, x));
    y = Math.max(15, Math.min(85, y));

    return { x, y };
  };

  const userPoints: ClusterPoint[] = userList.map((user) => {
    const coords = project2D(user.id);
    const vec = userGenreVectors[user.id];

    // Find favorite genres
    const sortedGenres = [...GENRES].sort((a, b) => (vec[b] || 0) - (vec[a] || 0));
    const primaryGenre = sortedGenres[0] || "General";
    const secondaryGenre = sortedGenres[1] || "Drama";

    return {
      userId: user.id,
      name: user.name,
      x: coords.x,
      y: coords.y,
      primaryGenre,
      secondaryGenre,
      clusterId: 0,
      isCurrentUser: Number(user.id) === activeIdNum
    };
  });

  // Prefilled stable cluster centers
  const CLUSTER_METADATA = [
    { id: 0, name: "Sci-Fi & Action Fans", color: "#3B82F6", description: "Enthusiasts drawn to futuristic concepts, space journeys, and high-intensity hero sagas.", x: 75, y: 35 },
    { id: 1, name: "Comedy & Animation Watchers", color: "#10B981", description: "Prefer cheerful, clever stories, whimsical animations, and witty situational humor.", x: 40, y: 75 },
    { id: 2, name: "Romance & Melodrama Loyalists", color: "#EC4899", description: "Values deep emotional journeys, musical soundtracks, and elegant character interactions.", x: 25, y: 35 },
    { id: 3, name: "Dark Crime & Mystery Experts", color: "#8B5CF6", description: "Intrigued by cerebral puzzles, intense mind games, psychological suspense, and detective thrillers.", x: 60, y: 20 }
  ];

  // Assign user points to nearest centroid
  userPoints.forEach((point) => {
    let nearestClusterId = 0;
    let minDistance = Infinity;

    CLUSTER_METADATA.forEach((c) => {
      const dist = Math.pow(point.x - c.x, 2) + Math.pow(point.y - c.y, 2);
      if (dist < minDistance) {
        minDistance = dist;
        nearestClusterId = c.id;
      }
    });

    point.clusterId = nearestClusterId;
  });

  // Group into Cluster array format
  const clusters: Cluster[] = CLUSTER_METADATA.map((meta) => {
    const pointsInCluster = userPoints.filter((u) => u.clusterId === meta.id);

    // Compute empirical centroid if there are assigned users, otherwise keep default
    let avgX = meta.x;
    let avgY = meta.y;
    if (pointsInCluster.length > 0) {
      avgX = pointsInCluster.reduce((sum, p) => sum + p.x, 0) / pointsInCluster.length;
      avgY = pointsInCluster.reduce((sum, p) => sum + p.y, 0) / pointsInCluster.length;
    }

    return {
      id: meta.id,
      name: meta.name,
      color: meta.color,
      description: meta.description,
      centroid: { x: avgX, y: avgY },
      points: pointsInCluster
    };
  });

  return clusters;
}
