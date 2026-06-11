import { Movie, Rating } from "./types.js";

export const GENRES = [
  "Sci-Fi",
  "Adventure",
  "Drama",
  "Animation",
  "Comedy",
  "Fantasy",
  "Action",
  "Thriller",
  "Mystery",
  "Crime",
  "Romance",
  "Musical"
];

export const MOVIES: Movie[] = [
  {
    id: 1,
    title: "Interstellar",
    genres: ["Sci-Fi", "Adventure", "Drama"],
    releaseYear: 2014,
    ratingAverage: 4.6,
    ratingCount: 20420,
    synopsis: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival under severe environmental collapse.",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "The Martian",
    genres: ["Sci-Fi", "Adventure", "Drama"],
    releaseYear: 2015,
    ratingAverage: 4.3,
    ratingCount: 15302,
    synopsis: "An astronaut becomes marooned on Mars after his crew assumes him dead, and must rely on his ingenuity to find a way to signal to Earth.",
    imageUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Dune: Part Two",
    genres: ["Sci-Fi", "Adventure", "Fantasy"],
    releaseYear: 2024,
    ratingAverage: 4.7,
    ratingCount: 8850,
    synopsis: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    imageUrl: "https://images.unsplash.com/photo-1547234935-80c7145ec969?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 4,
    title: "Arrival",
    genres: ["Sci-Fi", "Mystery", "Thriller"],
    releaseYear: 2016,
    ratingAverage: 4.1,
    ratingCount: 12900,
    synopsis: "A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.",
    imageUrl: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 5,
    title: "Blade Runner 2049",
    genres: ["Sci-Fi", "Action", "Thriller"],
    releaseYear: 2017,
    ratingAverage: 4.2,
    ratingCount: 9480,
    synopsis: "A new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos.",
    imageUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 6,
    title: "Inside Out 2",
    genres: ["Animation", "Comedy", "Adventure"],
    releaseYear: 2024,
    ratingAverage: 4.5,
    ratingCount: 6200,
    synopsis: "As Riley enters teenagehood, her mind headquarters faces a sudden demolition to make room for brand new emotions, including Anxiety.",
    imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 7,
    title: "Spirited Away",
    genres: ["Animation", "Fantasy", "Drama"],
    releaseYear: 2001,
    ratingAverage: 4.8,
    ratingCount: 13200,
    synopsis: "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, where humans are changed into beasts.",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 8,
    title: "The Dark Knight",
    genres: ["Action", "Crime", "Thriller"],
    releaseYear: 2008,
    ratingAverage: 4.9,
    ratingCount: 28900,
    synopsis: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.",
    imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 9,
    title: "Inception",
    genres: ["Action", "Sci-Fi", "Thriller"],
    releaseYear: 2010,
    ratingAverage: 4.7,
    ratingCount: 24700,
    synopsis: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 10,
    title: "Mad Max: Fury Road",
    genres: ["Action", "Sci-Fi", "Adventure"],
    releaseYear: 2015,
    ratingAverage: 4.3,
    ratingCount: 14100,
    synopsis: "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search of her homeland with the aid of a group of female prisoners.",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 11,
    title: "La La Land",
    genres: ["Romance", "Drama", "Musical"],
    releaseYear: 2016,
    ratingAverage: 4.4,
    ratingCount: 11800,
    synopsis: "While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 12,
    title: "Titanic",
    genres: ["Romance", "Drama"],
    releaseYear: 1997,
    ratingAverage: 4.2,
    ratingCount: 22000,
    synopsis: "A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic.",
    imageUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 13,
    title: "Before Sunrise",
    genres: ["Romance", "Drama"],
    releaseYear: 1995,
    ratingAverage: 4.3,
    ratingCount: 6500,
    synopsis: "A young man and woman meet on a train in Europe, and wind up spending one evening together in Vienna, knowing it will likely be their only night.",
    imageUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 14,
    title: "Pride & Prejudice",
    genres: ["Romance", "Drama"],
    releaseYear: 2005,
    ratingAverage: 4.2,
    ratingCount: 8900,
    synopsis: "Sparks fly when spirited Elizabeth Bennet meets single, rich, and proud Mr. Darcy. But Mr. Darcy reluctantly finds himself falling in love with her.",
    imageUrl: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 15,
    title: "The Silence of the Lambs",
    genres: ["Thriller", "Crime", "Drama"],
    releaseYear: 1991,
    ratingAverage: 4.7,
    ratingCount: 17500,
    synopsis: "A young F.B.I. cadet must receive the help of an incarcerated and manipulative cannibal killer to catch another serial killer.",
    imageUrl: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 16,
    title: "Se7en",
    genres: ["Thriller", "Crime", "Mystery"],
    releaseYear: 1995,
    ratingAverage: 4.6,
    ratingCount: 16900,
    synopsis: "Two detectives, a rookie and a veteran, hunt a serial killer who uses the seven deadly sins as his master plan motive.",
    imageUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 17,
    title: "Shutter Island",
    genres: ["Thriller", "Mystery", "Drama"],
    releaseYear: 2010,
    ratingAverage: 4.3,
    ratingCount: 14750,
    synopsis: "In 1954, a U.S. Marshal investigates the disappearance of a murderer who escaped from a hospital for the criminally insane.",
    imageUrl: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 18,
    title: "Parasite",
    genres: ["Thriller", "Drama", "Comedy"],
    releaseYear: 2019,
    ratingAverage: 4.6,
    ratingCount: 15100,
    synopsis: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 19,
    title: "Pulp Fiction",
    genres: ["Crime", "Thriller", "Drama"],
    releaseYear: 1994,
    ratingAverage: 4.5,
    ratingCount: 22100,
    synopsis: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 20,
    title: "The Grand Budapest Hotel",
    genres: ["Comedy", "Adventure", "Drama"],
    releaseYear: 2014,
    ratingAverage: 4.2,
    ratingCount: 9900,
    synopsis: "A writer relates his adventures at a renowned European resort hotel under the guidance of a legendary concierge in the interwar years.",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 21,
    title: "Superbad",
    genres: ["Comedy"],
    releaseYear: 2007,
    ratingAverage: 4.0,
    ratingCount: 10400,
    synopsis: "Two co-dependent high school seniors are forced to deal with separation anxiety after their plan to stage a booze-filled party goes awry.",
    imageUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 22,
    title: "Toy Story 4",
    genres: ["Animation", "Comedy", "Adventure"],
    releaseYear: 2019,
    ratingAverage: 4.1,
    ratingCount: 8400,
    synopsis: "When a new toy called 'Forky' joins Woody and the gang, a road trip alongside old and new friends reveals how big the world can be for a toy.",
    imageUrl: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 23,
    title: "Metropolis",
    genres: ["Sci-Fi", "Drama"],
    releaseYear: 1927,
    ratingAverage: 4.1,
    ratingCount: 4200,
    synopsis: "In a futuristic city sharply divided between the working class and the city planners, the son of the city's mastermind falls in love with a working-class prophet.",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 24,
    title: "Amélie",
    genres: ["Romance", "Comedy"],
    releaseYear: 2001,
    ratingAverage: 4.4,
    ratingCount: 11100,
    synopsis: "Amélie is an innocent and naive girl in Paris with her own sense of justice. She decides to help those around her and, along the way, discovers love.",
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 25,
    title: "Gladiator",
    genres: ["Action", "Adventure", "Drama"],
    releaseYear: 2000,
    ratingAverage: 4.5,
    ratingCount: 18900,
    synopsis: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.",
    imageUrl: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=600&auto=format&fit=crop"
  }
];

export const USERS = [
  { id: 101, name: "Alice (Sci-Fi Enthusiast)", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Alice" },
  { id: 102, name: "Bob (Action & Thriller Buff)", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Bob" },
  { id: 103, name: "Chloe (Romance & Musical Fan)", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Chloe" },
  { id: 104, name: "Dave (Animation & Comedy Lover)", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Dave" },
  { id: 105, name: "Emily (Cinephile Critic)", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Emily" },
  { id: 106, name: "Frank (Casual Explorer)", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Frank" },
  { id: 107, name: "Grace (Drama & Thriller Critic)", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Grace" },
  { id: 108, name: "Henry (Classic Aficionado)", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Henry" }
];

export const INITIAL_RATINGS: Rating[] = [
  // User 101: Alice (Sci-Fi Enthusiast)
  { userId: 101, movieId: 1, rating: 5 }, // Interstellar
  { userId: 101, movieId: 2, rating: 5 }, // The Martian
  { userId: 101, movieId: 3, rating: 4 }, // Dune: Part Two
  { userId: 101, movieId: 4, rating: 5 }, // Arrival
  { userId: 101, movieId: 5, rating: 4 }, // Blade Runner 2049
  { userId: 101, movieId: 9, rating: 5 }, // Inception
  { userId: 101, movieId: 10, rating: 4 }, // Mad Max: Fury Road
  { userId: 101, movieId: 12, rating: 1 }, // Titanic (Hates romance)
  { userId: 101, movieId: 13, rating: 2 }, // Before Sunrise (Hates romance)

  // User 102: Bob (Action & Thriller Buff)
  { userId: 102, movieId: 8, rating: 5 }, // The Dark Knight
  { userId: 102, movieId: 9, rating: 4 }, // Inception
  { userId: 102, movieId: 10, rating: 5 }, // Mad Max: Fury Road
  { userId: 102, movieId: 25, rating: 5 }, // Gladiator
  { userId: 102, movieId: 15, rating: 4 }, // Silence of the Lambs
  { userId: 102, movieId: 16, rating: 5 }, // Se7en
  { userId: 102, movieId: 5, rating: 4 }, // Blade Runner 2049
  { userId: 102, movieId: 11, rating: 1 }, // La La Land (No musicals)

  // User 103: Chloe (Romance & Musical Fan)
  { userId: 103, movieId: 11, rating: 5 }, // La La Land
  { userId: 103, movieId: 12, rating: 5 }, // Titanic
  { userId: 103, movieId: 13, rating: 4 }, // Before Sunrise
  { userId: 103, movieId: 14, rating: 5 }, // Pride & Prejudice
  { userId: 103, movieId: 24, rating: 4 }, // Amélie
  { userId: 103, movieId: 1, rating: 2 }, // Interstellar (Too long/cold)
  { userId: 103, movieId: 8, rating: 1 }, // Dark Knight (Too violent)

  // User 104: Dave (Animation & Comedy Lover)
  { userId: 104, movieId: 6, rating: 5 }, // Inside Out 2
  { userId: 104, movieId: 7, rating: 5 }, // Spirited Away
  { userId: 104, movieId: 22, rating: 4 }, // Toy Story 4
  { userId: 104, movieId: 20, rating: 4 }, // Grand Budapest Hotel
  { userId: 104, movieId: 21, rating: 5 }, // Superbad
  { userId: 104, movieId: 24, rating: 4 }, // Amélie
  { userId: 104, movieId: 15, rating: 1 }, // Silence of the Lambs (Too scary)

  // User 105: Emily (Cinephile Critic - very hard to please, loves Thrillers & unique Dramas)
  { userId: 105, movieId: 15, rating: 5 }, // Silence of the Lambs
  { userId: 105, movieId: 16, rating: 4 }, // Se7en
  { userId: 105, movieId: 17, rating: 4 }, // Shutter Island
  { userId: 105, movieId: 18, rating: 5 }, // Parasite
  { userId: 105, movieId: 19, rating: 4 }, // Pulp Fiction
  { userId: 105, movieId: 23, rating: 3 }, // Metropolis
  { userId: 105, movieId: 1, rating: 2 }, // Interstellar (Plot holes)
  { userId: 105, movieId: 12, rating: 1 }, // Titanic (Cheesy)

  // User 106: Frank (Casual Explorer - likes everything moderately)
  { userId: 106, movieId: 1, rating: 4 },
  { userId: 106, movieId: 6, rating: 3 },
  { userId: 106, movieId: 8, rating: 4 },
  { userId: 106, movieId: 11, rating: 3 },
  { userId: 106, movieId: 15, rating: 4 },
  { userId: 106, movieId: 18, rating: 4 },
  { userId: 106, movieId: 20, rating: 3 },

  // User 107: Grace (Drama & Thriller Critic)
  { userId: 107, movieId: 15, rating: 4 }, // Silence of the Lambs
  { userId: 107, movieId: 17, rating: 5 }, // Shutter Island
  { userId: 107, movieId: 18, rating: 5 }, // Parasite
  { userId: 107, movieId: 19, rating: 4 }, // Pulp Fiction
  { userId: 107, movieId: 12, rating: 4 }, // Titanic
  { userId: 107, movieId: 14, rating: 4 }, // Pride & Prejudice

  // User 108: Henry (Classic Aficionado)
  { userId: 108, movieId: 23, rating: 5 }, // Metropolis
  { userId: 108, movieId: 7, rating: 4 },  // Spirited Away
  { userId: 108, movieId: 15, rating: 4 }, // Silence of the Lambs
  { userId: 108, movieId: 14, rating: 3 }, // Pride & Prejudice
  { userId: 108, movieId: 21, rating: 1 }  // Superbad (Vulgar)
];
export const USER_MAP = new Map(USERS.map((u) => [u.id, u]));
