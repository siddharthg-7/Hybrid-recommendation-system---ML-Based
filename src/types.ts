export interface Movie {
  id: number;
  title: string;
  genres: string[];
  releaseYear: number;
  ratingAverage: number;
  ratingCount: number;
  imageUrl?: string;
  synopsis?: string;
}

export interface Rating {
  userId: number;
  movieId: number;
  rating: number; // 1 to 5 stars
  timestamp?: number;
}

export interface UserProfile {
  id: number;
  name: string;
  avatar: string;
  favoriteGenre: string;
  averageRating: number;
  moviesWatchedCount: number;
  activityScore: number; // 0-100 indicating frequency of interaction
  popularityBias: number; // 0-1 indicating tendency to watch popular movies
  genreFrequencies: Record<string, number>;
}

export interface RecommendationItem {
  movie: Movie;
  contentScore: number;  // content-based score (0-1)
  collaborativeScore: number; // collaborative filtering score (0-1)
  hybridScore: number; // weighted combination score (0-1)
  predictedRating: number; // predicted stars count (1-5)
  reason?: string;
}

export interface EvaluationMetrics {
  precisionAtK: number; // Precision@10 standard
  recallAtK: number; // Recall@10 standard
  rmse: number; // Root Mean Square Error
  mae: number; // Mean Absolute Error
  testSize: number;
  trainSize: number;
}

export interface ClusterPoint {
  userId: number;
  name: string;
  x: number; // Projected coordinate X for scatter visual
  y: number; // Projected coordinate Y for scatter visual
  primaryGenre: string;
  secondaryGenre: string;
  clusterId: number;
  isCurrentUser: boolean;
}

export interface Cluster {
  id: number;
  name: string;
  color: string;
  description: string;
  centroid: { x: number; y: number };
  points: ClusterPoint[];
}

export interface KMeanswResult {
  clusters: Cluster[];
  unassigned: ClusterPoint[];
}
