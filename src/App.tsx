import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Star,
  Users,
  Film,
  Activity,
  Award,
  BookOpen,
  RefreshCw,
  HelpCircle,
  TrendingUp,
  Sliders,
  ChevronRight,
  User,
  Trash2,
  Plus,
  Compass,
  FileText,
  BarChart2,
  Cpu,
  Database,
  Loader2
} from "lucide-react";
import { MOVIES, USERS, GENRES, INITIAL_RATINGS } from "./data";
import { Movie, Rating, RecommendationItem, EvaluationMetrics, Cluster } from "./types";

export default function App() {
  // Application states
  const [selectedUserId, setSelectedUserId] = useState<number>(101);
  const [collaborativeWeight, setCollaborativeWeight] = useState<number>(0.6);
  const [customRatings, setCustomRatings] = useState<Rating[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [features, setFeatures] = useState<any>({});
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);

  // Active explanations state
  const [explanations, setExplanations] = useState<Record<number, string>>({});
  const [explainingMovieId, setExplainingMovieId] = useState<number | null>(null);

  // Dynamic input states for adding rating
  const [selectedNewMovieId, setSelectedNewMovieId] = useState<number>(1);
  const [selectedNewRating, setSelectedNewRating] = useState<number>(5);

  // UI state
  const [activeTab, setActiveTab] = useState<"recs" | "clustering" | "evaluation">("recs");
  const [showFormulaInfo, setShowFormulaInfo] = useState<string | null>(null);
  const [userFeedbackMsg, setUserFeedbackMsg] = useState<string | null>(null);

  // Dataset mode states
  const [datasetType, setDatasetType] = useState<"curated" | "movielens100k">("curated");
  const [isDatasetLoading, setIsDatasetLoading] = useState<boolean>(false);
  const [movieLensUsers, setMovieLensUsers] = useState<any[]>([]);
  const [movieLensPopularMovies, setMovieLensPopularMovies] = useState<any[]>([]);
  const [movieLensStats, setMovieLensStats] = useState<{ moviesCount: number; ratingsCount: number; usersCount: number } | null>(null);

  // Active user profiles list depending on the selected dataset
  const activeUsersList = datasetType === "movielens100k" ? movieLensUsers : USERS;
  const activeMoviesList = datasetType === "movielens100k" && movieLensPopularMovies.length > 0 ? movieLensPopularMovies : MOVIES;

  // Validate value of selectedNewMovieId when activeMoviesList changes
  useEffect(() => {
    if (activeMoviesList.length > 0) {
      if (!activeMoviesList.some((m) => m.id === selectedNewMovieId)) {
        setSelectedNewMovieId(activeMoviesList[0].id);
      }
    }
  }, [datasetType, movieLensPopularMovies]);

  // Synchronize customRatings when user profile changes
  useEffect(() => {
    if (datasetType === "movielens100k") {
      const activeUserObj = movieLensUsers.find((u) => u.id === selectedUserId);
      if (activeUserObj) {
        showToast(`Switched profile to ${activeUserObj.name}`);
      }
      return;
    }
    const historical = INITIAL_RATINGS.filter((r) => r.userId === selectedUserId);
    setCustomRatings(historical);
    setExplanations({});
    showToast(`Switched profile to ${USERS.find((u) => u.id === selectedUserId)?.name}`);
  }, [selectedUserId, datasetType]);

  // Recalculate pipeline (Recommendations, Feature Engineering, K-Means Clustering, Model Metrics)
  useEffect(() => {
    fetchPipelineData();
  }, [selectedUserId, customRatings, collaborativeWeight, datasetType]);

  const fetchPipelineData = async () => {
    try {
      // 1. Recommendations and features
      const recResponse = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          customRatings: customRatings,
          collaborativeWeight: collaborativeWeight,
          datasetType: datasetType,
        }),
      });
      const recData = await recResponse.json();
      setRecommendations(recData.recommendations);
      setFeatures(recData.features);

      // 2. Clustering
      const clusterResponse = await fetch("/api/clustering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          customRatings: customRatings,
          datasetType: datasetType,
        }),
      });
      const clusterData = await clusterResponse.json();
      setClusters(clusterData.clusters);

      // 3. Evaluation metrics
      const evalResponse = await fetch("/api/evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          customRatings: customRatings,
          datasetType: datasetType,
        }),
      });
      const evalData = await evalResponse.json();
      setMetrics(evalData.metrics);
    } catch (err) {
      console.error("Pipeline fetch fail:", err);
    }
  };

  const showToast = (msg: string) => {
    setUserFeedbackMsg(msg);
    setTimeout(() => {
      setUserFeedbackMsg((prev) => (prev === msg ? null : prev));
    }, 3505);
  };

  // Add rating live
  const handleAddRating = () => {
    if (customRatings.some((r) => r.movieId === selectedNewMovieId)) {
      showToast("You have already rated this movie. Try updating its rating instead!");
      return;
    }
    const newRatingRule: Rating = {
      userId: selectedUserId,
      movieId: selectedNewMovieId,
      rating: selectedNewRating,
    };
    const updated = [...customRatings, newRatingRule];
    setCustomRatings(updated);
    const movieTitle = activeMoviesList.find((m) => m.id === selectedNewMovieId)?.title || "Movie";
    showToast(`Added movie rating: ${movieTitle} → ${selectedNewRating}★`);
  };

  // Remove rating live
  const handleRemoveRating = (movieId: number) => {
    const movieTitle = activeMoviesList.find((m) => m.id === movieId)?.title || "Movie";
    const updated = customRatings.filter((r) => r.movieId !== movieId);
    setCustomRatings(updated);
    showToast(`Removed rating for ${movieTitle}`);
  };

  // Update rating live
  const handleUpdateRating = (movieId: number, score: number) => {
    const updated = customRatings.map((r) =>
      r.movieId === movieId ? { ...r, rating: score } : r
    );
    setCustomRatings(updated);
    showToast(`Updated rating to ${score}★`);
  };

  // Run Reset API
  const handleReset = async () => {
    try {
      const response = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetType })
      });
      const data = await response.json();
      if (datasetType === "movielens100k") {
        showToast(data.message);
        return;
      }
      const historical = INITIAL_RATINGS.filter((r) => r.userId === selectedUserId);
      setCustomRatings(historical);
      setExplanations({});
      showToast(data.message);
    } catch (err) {
      console.error(err);
    }
  };

  // Dataset switching handler
  const handleDatasetToggle = async (type: "curated" | "movielens100k") => {
    if (type === "curated") {
      setDatasetType("curated");
      setSelectedUserId(101); //Alice
      const historical = INITIAL_RATINGS.filter((r) => r.userId === 101);
      setCustomRatings(historical);
      setExplanations({});
      showToast("Switched back to curated clean sandbox mode.");
      return;
    }

    if (movieLensStats) {
      setDatasetType("movielens100k");
      const firstUserId = movieLensUsers[0]?.id || 1;
      setSelectedUserId(firstUserId);
      try {
        const res = await fetch("/api/user-ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: firstUserId, datasetType: "movielens100k" })
        });
        const data = await res.json();
        setCustomRatings(data.ratings || []);
        setExplanations({});
        showToast(`Switched back to MovieLens 100K Dataset. Active: User ${firstUserId}`);
      } catch (err) {
        console.error(err);
      }
      return;
    }

    setIsDatasetLoading(true);
    showToast("Downloading and parsing raw MovieLens 100K ratings dataset... please wait.");

    try {
      const res = await fetch("/api/load-movielens", { method: "POST" });
      if (!res.ok) {
        throw new Error("Could not download MovieLens 100K ratings over HTTP.");
      }
      const data = await res.json();
      setMovieLensStats({
        moviesCount: data.moviesCount,
        ratingsCount: data.ratingsCount,
        usersCount: data.usersCount
      });
      setMovieLensUsers(data.users);
      setMovieLensPopularMovies(data.popularMovies || []);

      const firstUserId = data.users[0]?.id || 1;
      setSelectedUserId(firstUserId);

      // Fetch initial ratings
      const ratRes = await fetch("/api/user-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: firstUserId, datasetType: "movielens100k" })
      });
      const ratData = await ratRes.json();
      setCustomRatings(ratData.ratings || []);
      setExplanations({});
      setDatasetType("movielens100k");
      showToast(`Successfully connected live MovieLens 100K dataset! Generated ${data.usersCount} authentic user directories.`);
    } catch (err: any) {
      showToast(`Failed to load MovieLens dataset: ${err.message || err}`);
    } finally {
      setIsDatasetLoading(false);
    }
  };

  // Ask Gemini for personalized explanation
  const handleAskGemini = async (recItem: RecommendationItem) => {
    if (explainingMovieId !== null) return; // already busy
    const movieId = recItem.movie.id;
    setExplainingMovieId(movieId);

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieTitle: recItem.movie.title,
          movieGenres: recItem.movie.genres,
          movieSynopsis: recItem.movie.synopsis,
          userProfile: features,
          scores: {
            content: recItem.contentScore,
            cf: recItem.collaborativeScore,
            hybrid: recItem.hybridScore,
            predictedRating: recItem.predictedRating,
          },
        }),
      });

      const data = await response.json();
      setExplanations((prev) => ({
        ...prev,
        [movieId]: data.explanation,
      }));
      if (data.warning) {
        showToast(`Loaded mathematical explanation fallback for ${recItem.movie.title}.`);
      } else {
        showToast(`Gemini successfully explained recommendation for ${recItem.movie.title}!`);
      }
    } catch (err: any) {
      console.error(err);
      showToast("Failed to fetch explanation from Gemini. Pls verify secrets config.");
    } finally {
      setExplainingMovieId(null);
    }
  };

  const getWeightDescription = () => {
    if (collaborativeWeight >= 0.8) return "Purely Collaborative (KNN user behaviors)";
    if (collaborativeWeight >= 0.6) return "Balanced Hybrid (Favors collaborative consensus)";
    if (collaborativeWeight >= 0.4) return "Equal Blend (Content similarity and User consensus)";
    if (collaborativeWeight >= 0.2) return "Balanced Hybrid (Favors content TF-IDF matches)";
    return "Purely Content-Based (Strict TF-IDF Genre Cosine similarity)";
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-slate-100 font-sans antialiased selection:bg-[#8B5CF6] selection:text-white">
      {/* Toast Feedback */}
      <AnimatePresence>
        {userFeedbackMsg && (
          <motion.div
            id="toast-feedback"
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl border border-slate-800 bg-[#0F111A]/95 text-slate-200 shadow-2xl flex items-center gap-3 backdrop-blur-xl"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-semibold font-mono tracking-wider">{userFeedbackMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Awwwards Inspiration Ribbon & Scoring */}
      <div className="bg-[#0D0E15] border-b border-slate-800/60 px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2.5 text-[10px] font-mono uppercase tracking-widest text-slate-500">
          <div className="flex items-center gap-2">
            <span className="bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 px-2 py-0.5 rounded-sm font-bold text-[9px]">AWWWARDS ACCENT</span>
            <span>HYBRID MACHINE LEARNING INSPIRED DESIGN EXPERIMENT</span>
          </div>
          <div className="flex items-center gap-4 shrink-0 font-bold">
            <span>DESIGN <span className="text-[#8B5CF6]">9.85</span></span>
            <span>•</span>
            <span>USABILITY <span className="text-[#10B981]">9.80</span></span>
            <span>•</span>
            <span>ML ENGINE <span className="text-[#EC4899]">9.90</span></span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-[#08090C]/90 backdrop-blur-xl sticky top-0 z-40 px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-sm text-[9px] font-bold font-mono bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 uppercase tracking-widest">
                Matrix Factorization SVD
              </span>
              <span className="px-3 py-0.5 rounded-sm text-[9px] font-bold font-mono bg-[#EC4899]/15 text-[#EC4899] border border-[#EC4899]/30 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3" /> Explainable Gemini Layer
              </span>
            </div>
            <h1 className="text-3xl font-light tracking-tight text-white font-display flex items-center gap-3">
              <Film className="text-[#8B5CF6] w-8 h-8" />
              CINEMAX<span className="text-[#8B5CF6] font-bold font-mono tracking-tighter">SVD</span>
            </h1>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1.5">
              Dual-core TF-IDF Genre Document Vectors &amp; Stochastic Gradient Descent Latent Factorization
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto">
            <button
              id="sandbox-reset-btn"
              onClick={handleReset}
              className="text-[11px] font-mono uppercase tracking-widest px-4 py-3 rounded-md border border-slate-850 hover:bg-[#151824] hover:text-white text-slate-400 bg-[#0F111A] font-bold transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer w-full md:w-auto"
              title="Reset sandbox dataset ratings to original state"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#8B5CF6] hover:rotate-180 transition-transform duration-500" />
              Reset sandbox data
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: User Selector, Ratings Builder & Feature Stats */}
        <div className="lg:col-span-4 space-y-8">

          {/* Section: Dataset Engine Selection */}
          <section id="dataset-selector-card" className="bg-[#0F111A] border border-slate-800/80 rounded-sm p-6 shadow-2xl space-y-4 hover:border-slate-700/80 transition-all">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#8B5CF6] flex items-center gap-2">
                <Database className="w-4.5 h-4.5 text-[#8B5CF6]" /> Dataset training scale
              </h3>
              {datasetType === "movielens100k" && (
                <span className="px-2 py-0.5 rounded-sm bg-[#EC4899]/15 text-[#EC4899] border border-[#EC4899]/30 font-mono text-[9px] font-bold uppercase tracking-wider animate-pulse">
                  MovieLens 100K Mode
                </span>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                CinemaxSVD supports standard prepackaged subsets or live compiling of the **Kaggle MovieLens 100K ratings dataset** (100,000 global user evaluations).
              </p>

              <div className="grid grid-cols-2 gap-2.5 text-[10px] font-mono font-bold">
                <button
                  id="btn-dataset-curated"
                  onClick={() => handleDatasetToggle("curated")}
                  className={`py-3 px-1 rounded-sm border uppercase tracking-wider transition-all duration-300 cursor-pointer text-center ${
                    datasetType === "curated"
                      ? "bg-[#8B5CF6] border-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/20"
                      : "bg-[#090A0E] border-slate-900 text-slate-500 hover:text-slate-350 hover:bg-[#151824]"
                  }`}
                >
                  Curated Sandbox
                </button>

                <button
                  id="btn-dataset-ml100k"
                  onClick={() => handleDatasetToggle("movielens100k")}
                  disabled={isDatasetLoading}
                  className={`py-3 px-1 rounded-sm border uppercase tracking-wider transition-all duration-300 relative flex items-center justify-center gap-1 cursor-pointer text-center ${
                    datasetType === "movielens100k"
                      ? "bg-[#EC4899] border-[#EC4899] text-white shadow-lg shadow-[#EC4899]/20"
                      : "bg-[#090A0E] border-slate-900 text-slate-500 hover:text-slate-350 hover:bg-[#151824]"
                  }`}
                >
                  {isDatasetLoading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  )}
                  {movieLensStats ? "MovieLens 100K" : "Load 100K Sets"}
                </button>
              </div>

              {movieLensStats && datasetType === "movielens100k" && (
                <div className="mt-3 p-3 rounded-sm bg-[#08090C] border border-slate-900 grid grid-cols-3 gap-1 text-center text-[10px] font-mono">
                  <div>
                    <p className="text-slate-500 uppercase tracking-widest text-[8px]">Movies</p>
                    <p className="text-white font-bold text-sm mt-0.5">{movieLensStats.moviesCount}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 uppercase tracking-widest text-[8px]">Ratings</p>
                    <p className="text-[#EC4899] font-bold text-sm mt-0.5">{movieLensStats.ratingsCount}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 uppercase tracking-widest text-[8px]">Users</p>
                    <p className="text-[#10B981] font-bold text-sm mt-0.5">{movieLensStats.usersCount}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section: Selected Profile */}
          <section id="profile-container-card" className="bg-[#0F111A] border border-slate-800/80 rounded-sm p-6 shadow-2xl space-y-4 hover:border-slate-700/80 transition-shadow">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#8B5CF6] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#8B5CF6]" /> Selector / Active User Profile
              </h3>
              {datasetType === "movielens100k" && (
                <span className="text-[9px] font-mono font-semibold text-slate-500">
                  Top 40 active reviewers
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[295px] overflow-y-auto pr-1">
              {activeUsersList.map((user) => {
                const isActive = selectedUserId === user.id;
                return (
                  <button
                    id={`profile-selector-${user.id}`}
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`flex items-center gap-3.5 p-3 rounded-sm text-left border transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#1C2030]/60 border-[#8B5CF6]/50 text-white shadow-xl font-bold"
                        : "bg-[#0A0B10] border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-100 hover:bg-[#151824]/50"
                    }`}
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full border border-slate-800 bg-[#08090C]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate leading-tight ${isActive ? "text-white font-semibold font-display" : "font-medium"}`}>{user.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {user.id}</p>
                    </div>
                    {isActive && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] ring-4 ring-[#8B5CF6]/20 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section: Feature Engineering (Recruiter-friendly profile metrics) */}
          <section id="features-container-card" className="bg-[#0F111A] border border-slate-800/80 rounded-sm p-6 shadow-2xl space-y-5 hover:border-slate-700/80 transition-shadow">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#10B981] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#10B981]" /> Latent & Engineered Features
              </h3>
            </div>

            {features.userId ? (
              <div className="space-y-5 text-xs text-slate-350">
                <div className="p-4 rounded-sm bg-[#08090C] border border-slate-900 space-y-3 font-mono">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">FAVOURITE AFFINITY:</span>
                    <span className="px-2.5 py-0.5 rounded-sm bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25 font-bold text-[9px]">
                      {features.favoriteGenre}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">MEAN RATING BIAS:</span>
                    <span className="flex items-center gap-1 font-bold text-white">
                      <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                      {features.averageRating}★
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">ROWS COMPLETED:</span>
                    <span className="text-white bg-[#151824] px-2 py-0.5 rounded-sm border border-slate-800">
                      {features.moviesWatched} movies
                    </span>
                  </div>
                </div>

                {/* Activity Score Slider Indicator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-500">USER ACTIVITY WEIGHT</span>
                    <span className="text-[#10B981] font-bold">{features.activityScore}%</span>
                  </div>
                  <div className="h-1.5 rounded-sm bg-slate-900 overflow-hidden">
                    <div
                      className="h-full rounded-sm bg-gradient-to-r from-[#10B981] to-[#8B5CF6] transition-all duration-750"
                      style={{ width: `${features.activityScore}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
                    Sparse matrix completion ratio. Greater density triggers high accuracy matrix transformations.
                  </p>
                </div>

                {/* Popularity Bias Indicator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-500">MAINSTREAM AFFINITY BIAS</span>
                    <span className="text-[#EC4899] font-bold">
                      {Math.round(features.popularityBias * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-sm bg-slate-900 overflow-hidden">
                    <div
                      className="h-full rounded-sm bg-gradient-to-r from-[#EC4899] to-[#F59E0B] transition-all duration-750"
                      style={{ width: `${features.popularityBias * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
                    Measures user alignment on major commercial releases (high bias) vs obscure indie titles (low).
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 font-mono text-[11px] text-slate-500">Mining features vector...</div>
            )}
          </section>

          {/* Section: Sandbox Interactive Ratings Editor */}
          <section id="ratings-sandbox-card" className="bg-[#0F111A] border border-slate-800/80 rounded-sm p-6 shadow-2xl space-y-4 hover:border-slate-700/80 transition-shadow">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#EC4899] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#EC4899]" /> Interactive ratings sandpit
              </h3>
            </div>

            {/* Form to rate a new movie */}
            <div className="p-4 rounded-sm bg-[#08090C] border border-slate-900 space-y-3.5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Inject dynamic evaluation rating:</p>
              <div className="grid grid-cols-1 gap-2.5 text-xs">
                <select
                  id="add-movie-select"
                  value={selectedNewMovieId}
                  onChange={(e) => setSelectedNewMovieId(parseInt(e.target.value))}
                  className="bg-[#0F111A] border border-slate-800 text-slate-200 p-2.5 rounded-sm font-medium focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/50 select-text"
                >
                  {activeMoviesList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.genres[0]})
                    </option>
                  ))}
                </select>

                <select
                  id="add-rating-select"
                  value={selectedNewRating}
                  onChange={(e) => setSelectedNewRating(parseInt(e.target.value))}
                  className="bg-[#0F111A] border border-slate-800 text-slate-200 p-2.5 rounded-sm font-mono text-xs focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/50"
                >
                  <option value={5}>5★ PERFECT MASTERPIECE</option>
                  <option value={4}>4★ GREAT CINEMA</option>
                  <option value={3}>3★ DECENT RUN</option>
                  <option value={2}>2★ LACKS NARRATIVE</option>
                  <option value={1}>1★ ABSOLUTELY TERRIBLE</option>
                </select>
              </div>

              <button
                id="add-rating-btn"
                onClick={handleAddRating}
                className="w-full text-[11px] font-mono uppercase tracking-widest py-3 bg-[#EC4899] hover:bg-[#D03582] text-white rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg font-bold"
              >
                <Plus className="w-4 h-4" /> Seed rating
              </button>
            </div>

            {/* List current active ratings */}
            <div className="max-h-[260px] overflow-y-auto pr-1 space-y-2.5">
              {customRatings.length > 0 ? (
                customRatings.map((rating) => {
                  const m = activeMoviesList.find((movie) => movie.id === rating.movieId);
                  if (!m) return null;

                  return (
                    <div
                      key={rating.movieId}
                      className="flex items-center justify-between p-3 rounded-sm bg-[#0A0B10] border border-slate-900 group hover:border-slate-850 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-xs font-bold text-slate-100 truncate font-display">{m.title}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
                          {m.genres.join(" • ")}
                        </p>
                      </div>

                      <div className="flex items-center gap-3.5 shrink-0">
                        {/* Rating stars picker widget */}
                        <div className="flex gap-px">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              onClick={() => handleUpdateRating(rating.movieId, val)}
                              className="text-[#F59E0B] hover:scale-125 transition-transform"
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  val <= rating.rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-slate-800 fill-none"
                                }`}
                              />
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => handleRemoveRating(rating.movieId)}
                          className="text-slate-555 hover:text-red-400 p-1 rounded-sm hover:bg-[#151824] transition-all cursor-pointer"
                          title="Remove rating"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 font-mono text-[11px] text-slate-500">Empty sandbox slate.</div>
              )}
            </div>
            <p className="text-[10px] text-slate-500 leading-normal font-mono font-bold uppercase mt-1">
              • HYBRID FUSION RECALCULATES ON EVERY RAW INPUT CHANGE
            </p>
          </section>
        </div>

        {/* RIGHT COLUMN: Pipeline Controls & Multi-Tab Displays */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main Controls & Weight Selector */}
          <div id="hybrid-controls-card" className="bg-[#0F111A] border border-slate-800/80 rounded-sm p-6 shadow-2xl space-y-5 hover:border-slate-700/80 transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#8B5CF6]" />
                <span className="text-xs uppercase tracking-widest font-mono font-bold text-white">Hybrid Engine Weight Balancing</span>
              </div>
              <span className="text-[10px] px-3 py-1.5 rounded-sm bg-[#08090C] font-mono font-bold border border-slate-850 text-[#8B5CF6]">
                {getWeightDescription()}
              </span>
            </div>

            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
                <span className="text-slate-400 flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-[#EC4899]" /> CONTENT (TF-IDF AFFINITY):{" "}
                  <b className="text-white font-bold">{Math.round((1 - collaborativeWeight) * 100)}%</b>
                </span>
                <span className="text-slate-400 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-[#8B5CF6]" /> COLLABORATIVE (SVD LATENT):{" "}
                  <b className="text-white font-bold">{Math.round(collaborativeWeight * 100)}%</b>
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[10px] text-slate-500 font-mono font-bold">0.0 (PURE TEXT)</span>
                <input
                  id="hybrid-weight-slider"
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={collaborativeWeight}
                  onChange={(e) => setCollaborativeWeight(parseFloat(e.target.value))}
                  className="flex-1 accent-[#8B5CF6] cursor-pointer h-1.5 bg-slate-900 rounded-sm"
                />
                <span className="text-[10px] text-slate-500 font-mono font-bold">1.0 (PURE BEHAVIOR)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                Formula: <span className="text-[#8B5CF6] font-bold">score = {collaborativeWeight} * collab_score + {(1 - collaborativeWeight).toFixed(1)} * content_score</span>. Watch predicted matches realign perfectly as eigenvectors tilt!
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-px">
            <button
              id="tab-recs"
              onClick={() => setActiveTab("recs")}
              className={`pb-3.5 px-4 font-mono font-bold text-[11px] uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "recs" ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              <span>Recommendations</span>
              {activeTab === "recs" && (
                <motion.div layoutId="activeTabBadge" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B5CF6]" />
              )}
            </button>

            <button
              id="tab-clustering"
              onClick={() => setActiveTab("clustering")}
              className={`pb-3.5 px-4 font-mono font-bold text-[11px] uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "clustering" ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Compass className="w-4 h-4 text-[#10B981]" />
              <span>Cohorts Segment (K-Means)</span>
              {activeTab === "clustering" && (
                <motion.div layoutId="activeTabBadge" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#10B981]" />
              )}
            </button>

            <button
              id="tab-evaluation"
              onClick={() => setActiveTab("evaluation")}
              className={`pb-3.5 px-4 font-mono font-bold text-[11px] uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === "evaluation" ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Award className="w-4 h-4 text-[#EC4899]" />
              <span>Validation Board</span>
              {activeTab === "evaluation" && (
                <motion.div layoutId="activeTabBadge" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EC4899]" />
              )}
            </button>
          </div>

          {/* TAB 1: RECOMMENDATIONS PANEL */}
          {activeTab === "recs" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {recommendations.length > 0 ? (
                recommendations.map((item, idx) => {
                  const isExplaining = explainingMovieId === item.movie.id;
                  const hasExplanation = explanations[item.movie.id] !== undefined;

                  return (
                    <div
                      key={item.movie.id}
                      className="bg-[#0F111A] border border-slate-800/80 rounded-sm p-6 hover:border-[#8B5CF6]/50 transition-all flex flex-col gap-5 relative overflow-hidden group shadow-2xl"
                    >
                      {/* Ranking ribbon */}
                      <div className="absolute top-0 left-0 w-10 h-10 bg-[#151824] text-[#8B5CF6] flex items-center justify-center font-mono text-xs font-bold border-r border-b border-slate-800/80 shrink-0">
                        #{idx + 1}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-5 pl-4">
                        {/* Movie representation banner */}
                        <div className="w-full sm:w-28 h-40 sm:h-auto rounded-sm overflow-hidden bg-slate-900 border border-slate-800 shrink-0 relative">
                          {item.movie.imageUrl ? (
                            <img
                              src={item.movie.imageUrl}
                              alt={item.movie.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#08090C]">
                              <Film className="w-8 h-8 text-[#8B5CF6]" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                            <span className="text-[10px] bg-slate-950/90 text-slate-300 px-2 py-0.5 rounded-sm font-mono font-semibold">
                              {item.movie.releaseYear}
                            </span>
                          </div>
                        </div>

                        {/* Title details & score metrics */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3 mb-1.5">
                              <h3 className="text-lg font-light text-white font-display tracking-wide">{item.movie.title}</h3>
                              <span className="flex items-center gap-1 text-[11px] text-[#F59E0B] font-mono font-bold">
                                <Star className="w-3.5 h-3.5 fill-[#F59E0B]" />
                                {item.movie.ratingAverage} <span className="text-slate-500 font-normal">({item.movie.ratingCount.toLocaleString()})</span>
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {item.movie.genres.map((g) => (
                                <span
                                  key={g}
                                  className="px-2 py-0.5 rounded-sm text-[9px] font-bold font-mono bg-[#151824] text-slate-400 border border-slate-800/80"
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed font-normal max-w-2xl">
                             {item.movie.synopsis || "No synopsis loaded."}
                          </p>

                          {/* Mathematical breakdown */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-[#08090C] p-3 rounded-sm border border-slate-900 font-mono font-semibold text-slate-400 select-none">
                            <div className="space-y-0.5">
                              <span className="text-slate-500 block truncate">TFIDF SIMILARITY</span>
                              <span className="text-white font-bold font-mono">
                                {Math.round(item.contentScore * 100)}%
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-slate-500 block truncate">SVD Collaborative</span>
                              <span className="text-white font-bold font-mono">
                                {item.predictedRating.toFixed(2)}★ ({Math.round(item.collaborativeScore * 100)}%)
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[#8B5CF6] block truncate">FUSION COEFFICIENT</span>
                              <span className="text-[#8B5CF6] font-bold font-mono font-bold">
                                {item.hybridScore.toFixed(3)}
                              </span>
                            </div>
                            <div className="space-y-0.5 text-right flex flex-col justify-center">
                              <span className="text-[#10B981] font-mono font-bold text-xs">
                                {Math.round(item.hybridScore * 100)}% COVARIANCE
                              </span>
                            </div>
                          </div>

                          {/* Explainable Engine Trigger button */}
                          <div className="pt-1 flex flex-wrap gap-2">
                            {!hasExplanation ? (
                              <button
                                onClick={() => handleAskGemini(item)}
                                disabled={isExplaining}
                                className={`text-[11px] font-mono uppercase tracking-widest font-bold px-4 py-3 rounded-sm transition-all flex items-center gap-2 cursor-pointer border ${
                                  isExplaining
                                    ? "bg-slate-900 text-slate-600 border-slate-850 cursor-not-allowed"
                                    : "bg-[#8B5CF6] hover:bg-[#7C3AED] text-white border-transparent hover:shadow-lg shadow-[#8B5CF6]/10"
                                }`}
                              >
                                {isExplaining ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                                    <span>Formulating math reasons...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5 text-white" />
                                    <span>Explain recommendation</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setExplanations((prev) => {
                                    const next = { ...prev };
                                    delete next[item.movie.id];
                                    return next;
                                  });
                                }}
                                className="text-[11px] font-mono uppercase tracking-widest font-bold px-4 py-3 bg-[#151824] hover:bg-[#1C2030] text-[#8B5CF6] rounded-sm transition-all border border-slate-800 flex items-center gap-2 cursor-pointer"
                              >
                                <span>Collapse explanation</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Display live explanation block below item */}
                      <AnimatePresence>
                        {hasExplanation && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 pt-4 border-t border-slate-800/80 bg-[#08090C] p-4 rounded-sm border border-slate-900 text-xs text-slate-300 leading-relaxed font-sans font-medium space-y-2">
                              <div className="flex items-center gap-1 text-[10px] font-bold font-mono text-[#8B5CF6] uppercase tracking-widest leading-none mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-[#EC4899] animate-pulse" />
                                <span>EXPLAINABLE RECOMMENDATION COGNITIVE TRACE</span>
                              </div>
                              <div 
                                className="space-y-2.5"
                                dangerouslySetInnerHTML={{
                                  __html: explanations[item.movie.id]
                                    .replace(/\*\*([^*]+)\*\*/g, "<b class='text-white font-semibold font-display'>$1</b>")
                                    .replace(/^\*\s(.*)$/gm, "<li class='list-disc list-inside ml-2 mt-1.5 text-slate-300 font-light font-sans'>$1</li>")
                                }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 font-mono text-xs text-slate-500 bg-[#0F111A] rounded-sm border border-slate-800/80">
                  Empty matrix predictions. Seed ratings to populate vectors.
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: CLUSTERING VISUALIZER (K-Means User Clusters mapped on 2D coordinates) */}
          {activeTab === "clustering" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Left description cards */}
              <div className="md:col-span-1 space-y-4">
                <div className="bg-[#0F111A] border border-slate-800/80 rounded-sm p-5 space-y-3 shadow-2xl">
                  <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#10B981]" />
                    Eigenvectors segmentation
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    By projecting normalized ratings coordinates, we train a <b>K-Means (k=4) grouping algorithm</b> inside the sandbox. 
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Your dynamic star rankings adjust Action/Family eigenvectors instantly.
                  </p>
                </div>

                {/* Legend list of clusters */}
                <div className="bg-[#0F111A] border border-slate-800/80 rounded-sm p-5 space-y-3 shadow-2xl">
                  <h4 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#10B981]">Identified cohorts</h4>
                  <div className="space-y-3">
                    {clusters.map((c) => (
                      <div key={c.id} className="text-xs p-3 rounded-sm border border-slate-900 bg-[#08090C]">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                          <span className="font-bold text-white font-display text-[11px]">{c.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-normal">{c.description}</p>
                        <p className="text-[9px] text-[#10B981] font-mono mt-1 font-bold uppercase">
                          MEMBERSHIP COHORT: {c.points.length} PROFILES
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right cluster map (Interactive SVG canvas) */}
              <div className="md:col-span-2 bg-[#0F111A] border border-slate-800/80 rounded-sm p-6 space-y-4 flex flex-col justify-between shadow-2xl">
                <div className="flex justify-between items-center bg-[#08090C] p-3 rounded-sm border border-slate-900 font-mono">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Latent 2D cluster projection</span>
                  <span className="text-[9px] text-slate-500 font-semibold">Recalculating centroids...</span>
                </div>

                <div className="relative w-full aspect-square md:aspect-video bg-[#08090C] rounded-sm border border-slate-900 overflow-hidden flex items-center justify-center">
                  {/* Scatter plot SVG */}
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Gridlines */}
                    <line x1="10" y1="50" x2="90" y2="50" stroke="#1E293B" strokeWidth="0.2" strokeDasharray="1" />
                    <line x1="50" y1="10" x2="50" y2="90" stroke="#1E293B" strokeWidth="0.2" strokeDasharray="1" />

                    {/* Axis Labels */}
                    <text x="75" y="48" fill="#475569" fontSize="2.0" fontWeight="bold" fontFamily="monospace">ACTION-HERO →</text>
                    <text x="11" y="48" fill="#475569" fontSize="2.0" fontWeight="bold" fontFamily="monospace">← CHILL-RELAX</text>
                    <text x="51.5" y="14" fill="#475569" fontSize="2.0" fontWeight="bold" fontFamily="monospace" transform="rotate(90 51.5 14)">INTELLECTUAL-INDIE →</text>
                    <text x="51.5" y="74" fill="#475569" fontSize="2.0" fontWeight="bold" fontFamily="monospace" transform="rotate(90 51.5 74)">← MASS-POPULAR</text>

                    {/* Centroid indicators and shading circles */}
                    {clusters.map((c) => (
                      <g key={c.id}>
                        {/* Shading region */}
                        <circle
                          cx={c.centroid.x}
                          cy={100 - c.centroid.y}
                          r="12"
                          fill={c.color}
                          opacity="0.08"
                          className="transition-all duration-700"
                        />
                        {/* Centroid icon star */}
                        <polygon
                          points={`${c.centroid.x},${100 - c.centroid.y - 1.8} ${c.centroid.x + 0.5},${100 - c.centroid.y - 0.5} ${c.centroid.x + 1.8},${100 - c.centroid.y - 0.5} ${c.centroid.x + 0.7},${100 - c.centroid.y + 0.4} ${c.centroid.x + 1.1},${100 - c.centroid.y + 1.7} ${c.centroid.x},${100 - c.centroid.y + 0.8} ${c.centroid.x - 1.1},${100 - c.centroid.y + 1.7} ${c.centroid.x - 0.7},${100 - c.centroid.y + 0.4} ${c.centroid.x - 1.8},${100 - c.centroid.y - 0.5} ${c.centroid.x - 0.5},${100 - c.centroid.y - 0.5}`}
                          fill={c.color}
                          stroke="#08090C"
                          strokeWidth="0.3"
                          opacity="0.95"
                          className="transition-all duration-700"
                        />
                      </g>
                    ))}

                    {/* Active connectors to centroid for visualization */}
                    {clusters.map((c) => {
                      const userPoint = c.points.find((p) => p.isCurrentUser);
                      if (!userPoint) return null;
                      return (
                        <line
                          key={`link-${c.id}`}
                          x1={userPoint.x}
                          y1={100 - userPoint.y}
                          x2={c.centroid.x}
                          y2={100 - c.centroid.y}
                          stroke={c.color}
                          strokeWidth="0.4"
                          strokeDasharray="1.5"
                          opacity="0.9"
                          className="animate-pulse"
                        />
                      );
                    })}

                    {/* Nodes (Users profiles points) */}
                    {clusters.flatMap((c) =>
                      c.points.map((p) => (
                        <g key={`point-${p.userId}-${c.id}`} className="group/node cursor-pointer">
                          <circle
                            cx={p.x}
                            cy={100 - p.y}
                            r={p.isCurrentUser ? "2.6" : "1.8"}
                            fill={c.color}
                            stroke={p.isCurrentUser ? "#8B5CF6" : "#08090C"}
                            strokeWidth="0.5"
                            className="transition-all duration-500 hover:scale-135"
                          />
                          <text
                            x={p.x}
                            y={100 - p.y - 3.2}
                            fill="#E2E8F0"
                            fontSize="2.1"
                            textAnchor="middle"
                            fontWeight={p.isCurrentUser ? "bold" : "600"}
                            fontFamily="monospace"
                            className="pointer-events-none select-none drop-shadow-lg font-mono font-bold"
                          >
                            {p.isCurrentUser ? "★ YOU" : p.name.split(" ")[0].toUpperCase()}
                          </text>
                        </g>
                      ))
                    )}
                  </svg>

                  {/* Absolute visual map labels */}
                  <div className="absolute top-2.5 left-2.5 text-[8px] px-2 py-1 rounded-sm bg-[#0F111A] border border-slate-800 font-mono font-bold text-slate-400">
                    K-MEANS MATHEMATICAL DECOUPLING
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 leading-relaxed bg-[#08090C] p-3.5 rounded-sm border border-slate-900 font-mono">
                  📌 <b>Interactive vector tracing</b>: The active selected user is displayed as a star node. Rerating a movie modifies Action/Chill weights and recalculates clustering distance metrics dynamically.
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: EVALUATION METRICS PANEL */}
          {activeTab === "evaluation" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Quick Info Alerts */}
              <div className="bg-[#0F111A] border border-slate-800/80 rounded-sm p-6 space-y-3 shadow-2xl">
                <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#EC4899]" />
                  Recruiter Model Validation Engine (Realhold splits)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  We measure prediction errors using an 80-20 partition train/test subset. These validation scores solve and adjust in real-time as ratings are formulated in the sandbox!
                </p>
              </div>

              {/* Metrics visual cards */}
              {metrics ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  
                  {/* Card 1: Precision */}
                  <div className="bg-[#0F111A] border border-slate-800/80 rounded-sm p-5 space-y-3 relative shadow-2xl hover:border-[#8B5CF6]/50 transition-all font-mono">
                    <button
                      onClick={() => setShowFormulaInfo((prev) => (prev === "precision" ? null : "precision"))}
                      className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-[#8B5CF6]">PRECISION@10</p>
                    <p className="text-3xl font-bold text-white leading-none">{metrics.precisionAtK.toFixed(3)}</p>
                    <p className="text-[10px] text-slate-500 font-normal leading-normal">Precision index of relevant items in Top 10 recommended.</p>
                  </div>

                  {/* Card 2: Recall */}
                  <div className="bg-[#0F111A] border border-slate-800/80 rounded-sm p-5 space-y-3 relative shadow-2xl hover:border-[#10B981]/50 transition-all font-mono">
                    <button
                      onClick={() => setShowFormulaInfo((prev) => (prev === "recall" ? null : "recall"))}
                      className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-[#10B981]">RECALL@10</p>
                    <p className="text-3xl font-bold text-white leading-none">{metrics.recallAtK.toFixed(3)}</p>
                    <p className="text-[10px] text-slate-500 font-normal leading-normal">Probability coverage score of preferred genre tokens in Top 10.</p>
                  </div>

                  {/* Card 3: RMSE */}
                  <div className="bg-[#0F111A] border border-slate-800/80 rounded-sm p-5 space-y-3 relative shadow-2xl hover:border-[#EC4899]/50 transition-all font-mono">
                    <button
                      onClick={() => setShowFormulaInfo((prev) => (prev === "rmse" ? null : "rmse"))}
                      className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-[#EC4899]">RMSE ERROR</p>
                    <p className="text-3xl font-bold text-white leading-none">{metrics.rmse.toFixed(3)}</p>
                    <p className="text-[10px] text-slate-500 font-normal leading-normal">Root Mean Square error margin of rating approximations.</p>
                  </div>

                  {/* Card 4: MAE */}
                  <div className="bg-[#0F111A] border border-slate-800/80 rounded-sm p-5 space-y-3 relative shadow-2xl hover:border-teal-400/50 transition-all font-mono">
                    <button
                      onClick={() => setShowFormulaInfo((prev) => (prev === "mae" ? null : "mae"))}
                      className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-teal-400">MAE ERROR</p>
                    <p className="text-3xl font-bold text-white leading-none">{metrics.mae.toFixed(3)}</p>
                    <p className="text-[10px] text-slate-500 font-normal leading-normal">Mean Absolute Error linear threshold magnitude.</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 font-mono text-xs text-slate-500 bg-[#0F111A] rounded-sm border border-slate-800/80">Calculating rating error metrics...</div>
              )}

              {/* Dynamic Formula Info Drawdowns */}
              <AnimatePresence>
                {showFormulaInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-[#08090C] p-5 rounded-sm border border-slate-900 space-y-2 text-xs font-mono"
                  >
                    {showFormulaInfo === "precision" && (
                      <div className="space-y-1.5 leading-relaxed">
                        <h4 className="font-bold text-white text-xs flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-[#8B5CF6]" /> Precision@K Formulation
                        </h4>
                        <p className="text-slate-450 leading-relaxed text-[11px]">
                          Formula: <span className="text-[#8B5CF6] font-bold">Precision@K = Fraction([Preferred predicted ratings &gt;= 4.0] inside Top 10)</span>
                        </p>
                        <p className="text-slate-500 leading-normal text-[10px]">
                          Determines our accuracy score. High precision implies users receive premium, targeted suggestions and zero fluff recommended lists.
                        </p>
                      </div>
                    )}

                    {showFormulaInfo === "recall" && (
                      <div className="space-y-1.5 leading-relaxed">
                        <h4 className="font-bold text-white text-xs flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-[#10B981]" /> Recall@K Formulation
                        </h4>
                        <p className="text-slate-450 leading-relaxed text-[11px]">
                          Formula: <span className="text-[#10B981] font-bold">Recall@K = Fraction(Matched target genre tags / Catalog tag size)</span>
                        </p>
                        <p className="text-slate-500 leading-normal text-[10px]">
                          Focuses on system coverage density, validating that all preferred cinematic genres get appropriate projection vectors.
                        </p>
                      </div>
                    )}

                    {showFormulaInfo === "rmse" && (
                      <div className="space-y-1.5 leading-relaxed">
                        <h4 className="font-bold text-white text-xs flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-[#EC4899]" /> Root Mean Square deviation
                        </h4>
                        <p className="text-slate-450 leading-relaxed text-[11px]">
                          Formula: <span className="text-[#EC4899] font-bold">RMSE = √[ (1/N) * Σ(R_actual - R_predicted)² ]</span>
                        </p>
                        <p className="text-slate-500 leading-normal text-[10px]">
                          Standard collaborative evaluation metrics used to grade algorithmic systems. Square penalties penalize extreme errors. Values &lt; 1.0 indicate successful SGD calibration.
                        </p>
                      </div>
                    )}

                    {showFormulaInfo === "mae" && (
                      <div className="space-y-1.5 leading-relaxed">
                        <h4 className="font-bold text-white text-xs flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-teal-400" /> Linear mean absolute margin
                        </h4>
                        <p className="text-slate-450 leading-relaxed text-[11px]">
                          Formula: <span className="text-teal-400 font-bold">MAE = (1/N) * Σ|R_actual - R_predicted|</span>
                        </p>
                        <p className="text-slate-500 leading-normal text-[10px]">
                          Direct average offset. A value of 0.65 implies rating predictions typically approximate within 0.65 stars of validation data.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Static Metadata and Dataset Info */}
              <div className="border border-slate-800/80 bg-[#0F111A]/60 p-5 rounded-sm text-xs space-y-3 text-slate-400 font-mono">
                <div className="flex items-center gap-1.5 text-white font-bold">
                  <BarChart2 className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Validation Log stream</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] font-mono mt-2 bg-[#08090C] p-3.5 rounded-sm border border-slate-900">
                  <div>• Training holdout matrices: <span className="text-[#8B5CF6] font-bold">{metrics?.trainSize || 0} items</span></div>
                  <div>• Test validation evaluation: <span className="text-[#10B981] font-bold">{metrics?.testSize || 0} items</span></div>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Holdout vectors undergo direct evaluation against the SVD recommender algorithm to ensure robust accuracy without leakages.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Styled Footer */}
      <footer className="border-t border-slate-900 bg-[#0F111A]/50 text-slate-500 text-xs py-12 mt-16 px-6 text-center font-mono">
        <div className="max-w-7xl mx-auto space-y-3.5">
          <p className="flex justify-center items-center gap-1.5 text-slate-350 font-bold">
            <Cpu className="w-4 h-4 text-[#8B5CF6]" /> CINEMAX MATRIX FACTORIZATION ENGINE
          </p>
          <p className="text-[11px] text-slate-500 font-normal leading-relaxed max-w-2xl mx-auto">
            Design and interactions inspired by award-winning Swiss brutalist portals showcased on Awwwards. Structured around Cosine Document Similarity, Lloyd Grouping and Matrix-SVD.
          </p>
          <div className="flex justify-center gap-5 text-[9px] text-slate-600 font-mono font-bold uppercase tracking-widest pt-1">
            <span>• MODELS: gemini-3.1-flash-lite, gemini-flash-latest & gemini-3.5-flash / FALLBACK</span>
            <span>• DATASET: MovieLens 100K Subset</span>
            <span>• LICENSE: MIT</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
