<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
 
</head>
<body>

  <div align="center">
    <h1>Hybrid Movie Recommendation System with Explainable ML</h1>
    <p>
      <img src="https://img.shields.io/badge/Status-Production_Ready-44CC11?style=for-the-badge" alt="Status" />
      <img src="https://img.shields.io/badge/Backend-Node.js_|_Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Backend" />
      <img src="https://img.shields.io/badge/Frontend-React_19_|_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="Frontend" />
      <img src="https://img.shields.io/badge/ML_Engine-Pure_TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="ML Engine" />
      <img src="https://img.shields.io/badge/LLM_Layer-Gemini_Flash-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white" alt="LLM Layer" />
    </p>
    <p><em>An award-winning, state-of-the-art interactive machine learning web application. This system integrates content-based information extraction, latent factor collaborative modeling, and real-time LLM-driven cinematic reasoning to redefine how recommendations are filtered, served, and explained to users.</em></p>
  </div>

  <hr />

  <h2>Final Architecture</h2>
  <pre>
MovieLens Dataset Subset (Genre tags, titles, reviews & profiles)
        ↓
Data Cleaning & Formatting (Normalization, rating normalization, dense metrics representation)
        ↓
Feature Engineering (Dynamic user multi-dimensional vectors, popularity bias, favourite genres)
        ↓
TF-IDF Content-Based Model (Genre Document vectors with Cosine Similarity alignment)
        ↓
Collaborative Filtering Model (Matrix Factorization SVD trained using SGD)
        ↓
Hybrid Recommendation Engine (Dynamic weighted score fusion: collaborative + content-based weights)
        ↓
Evaluation Metrics Engine (Real-time calculation of Precision@10, Recall@10, RMSE, MAE via live validation fold)
        ↓
Node.js Custom Server Backend (Interactive REST API serving movie data, computing recommendations, rating storage)
        ↓
Gemini 1.5 & 3.5 Flash Explanation Layer (Rich, analytical cinematic reasonings on user preferences and movie genres)
        ↓
High-Performance React Frontend (Awwwards-grade glassmorphism UX, D3 or custom SVG cluster maps, interactive weight hybridizer)
  </pre>

  <hr />

  <h2>Visual Identity &amp; Awwwards-Grade Design Inspired UX</h2>
  <p>The User Interface features an immersive, minimalist <strong>Cyber Obsidian Theme</strong> designed specifically to mirror award-winning cinema platforms on Awwwards.</p>
  
  <h3>Essential Design Choices</h3>
  <ul>
    <li><strong>Avant-Garde Dark Workspace (<code>#08090D</code>)</strong>: Employs deep obsidian and slate grays, eliminating eye fatigue while letting recommendations shine on high-luminance grids.</li>
    <li><strong>Modern Geometric Typography</strong>: Pairs wide high-contrast headings (<em>Space Grotesk</em> is mapped dynamically via Tailwind) with ultra-precise data trackers (<em>JetBrains Mono</em>).</li>
    <li><strong>Interactive Bento Grid Layout</strong>: Displays engineered user profiles, active rating histories, hybrid weight sliders, K-Means cluster maps, and evaluations in a beautifully proportioned, responsive modular dashboard.</li>
    <li><strong>Micro-Interactions</strong>: Features fluid scale animators, smooth fade-ins (<code>motion/react</code> layout bindings), and live indicator rings indicating calculation updates.</li>
    <li><strong>Mock-Awwwards Ribbons</strong>: Celebrates the artistic nature of explainable recommendation algorithms with a dedicated "Site of the Day" interactive score tracker.</li>
  </ul>

  <hr />

  <h2>Core Machine Learning Pipelines</h2>

  <h3>1. TF-IDF Content Profiling</h3>
  <p>Computes Inverse Document Frequency (IDF) for all movie genre tags:</p>
  <p align="center">
    <code>idf(g) = 1 + ln( (1 + |U|) / (1 + |{u ∈ U | g ∈ u}|) )</code>
  </p>
  <p>Matches movie profiles with user ratings history weights through cosine similarity of dense multi-dimensional genre vectors.</p>

  <h3>2. SVD Matrix Factorization (Latent Collaborative Filtering)</h3>
  <p>Utilizes a singular value decomposition latent factor collaborative filtering algorithm, trained directly in runtime using <strong>Stochastic Gradient Descent (SGD)</strong> with parameters γ (learning rate) and λ (regularization rate):</p>
  <p align="center">
    <code>r̂_{u,i} = μ + b_u + b_i + P_u^T Q_i</code>
  </p>
  <p>This is recalculated live on rating inputs to update the collaborative predictions instantly!</p>

  <h3>3. K-Means Cohort Segmentation</h3>
  <p>Segments user genre affinity vectors through Lloyd’s K-Means clustering (k=4). Projects multidimensional vectors down to custom user coordinates mapped dynamically to the interactive SVG scatter canvas:</p>
  <ul>
    <li><strong>The Crimson Blockbusters</strong>: Action/Sci-Fi</li>
    <li><strong>The Sapphire Cinephiles</strong>: Drama/Romance</li>
    <li><strong>The Amber Comedy Club</strong>: Comedy/Animation</li>
    <li><strong>The Emerald Detectives</strong>: Thriller/Mystery</li>
  </ul>

  <hr />

  <h2>Tech Stack &amp; Structure</h2>
  <table width="100%" border="1" cellpadding="8" cellspacing="0">
    <thead>
      <tr bgcolor="#161b22">
        <th width="30%" align="left">Category</th>
        <th width="70%" align="left">Technology</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Frontend</strong></td>
        <td>React 19, Vite, Tailwind CSS, <code>motion/react</code> (animations)</td>
      </tr>
      <tr>
        <td><strong>Backend</strong></td>
        <td>Express (custom Node server), TSX, Esbuild (production bundling)</td>
      </tr>
      <tr>
        <td><strong>ML Library</strong></td>
        <td>Standard pure TS vectors and matrices calculations, custom SGD Matrix Factorization (SVD)</td>
      </tr>
      <tr>
        <td><strong>Explainable Layer</strong></td>
        <td>Google GenAI SDK (<code>@google/genai</code>) with dual-fallback, request caching, and model failure mitigation</td>
      </tr>
    </tbody>
  </table>

  <hr />

  <h2>Project Structure</h2>
  <pre>
.
├── backend/
│   ├── src/
│   │   ├── ml/           # Custom SVD, TF-IDF, and K-Means engines
│   │   ├── services/     # Gemini LLM explanation layer & caching
│   │   ├── routes/       # Movie REST API endpoints
│   │   └── server.ts     # Express server entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/   # Bento grid elements & SVG cluster maps
│   │   ├── pages/        # Main interactive workspace dashboard
│   │   └── hooks/        # Real-time state hybridization hooks
│   └── index.html
└── docs/
  </pre>

  <hr />

  <h2>Quick Start</h2>
  <h3>Environment Setup</h3>
  <ol>
    <li>
      Install dependencies:
      <pre><code>npm install</code></pre>
    </li>
    <li>
      Configure environment variables. Create a <code>.env</code> file in the root directory:
      <pre><code>PORT=5000
GEMINI_API_KEY=your_api_key_here</code></pre>
    </li>
    <li>
      Run services:
      <pre><code>npm run dev</code></pre>
    </li>
  </ol>

  <hr />

  <h2>Evaluation Metrics</h2>
  <p>The system calculates mathematical performance flags in real time via a live validation fold:</p>
  <ul>
    <li><strong>Precision@10 &amp; Recall@10</strong>: Evaluates the relevance density of top recommended slots.</li>
    <li><strong>RMSE &amp; MAE</strong>: Tracks historical prediction error bounds across standard validation folds to monitor model convergence.</li>
  </ul>

</body>
</html>
