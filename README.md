# 🎬 Hybrid movie Recommendation System with Explainable ML

An award-winning, state-of-the-art interactive machine learning web application. This system integrates content-based information extraction, latent factor collaborative modeling, and real-time LLM-driven cinematic reasoning to redefine how recommendations are filtered, served, and explained to users.

---

## 📐 Final Architecture

```
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
```

---

## 🎨 Visual Identity & Awwwards-Grade Design Inspired UX

The User Interface features an immersive, minimalist **Cyber Obsidian Theme** designed specifically to mirror award-winning cinema platforms on [Awwwards](https://www.awwwards.com/).

### ✨ Essential Design Choices
* **Avant-Garde Dark Workspace (`#08090D`)**: Employs deep obsidian and slate grays, eliminating eye fatigue while letting recommendations shine on high-luminance grids.
* **Modern Geometric Typography**: Pairs wide high-contrast headings (*Space Grotesk* is mapped dynamically via Tailwind) with ultra-precise data trackers (*JetBrains Mono*).
* **Interactive Bento Grid Layout**: Displays engineered user profiles, active rating histories, hybrid weight sliders, K-Means cluster maps, and evaluations in a beautifully proportioned, responsive modular dashboard.
* **Micro-Interactions**: Features fluid scale animators, smooth fade-ins (`motion/react` layout bindings), and live indicator rings indicating calculation updates.
* **Mock-Awwwards Ribbons**: Celebrates the artistic nature of explainable recommendation algorithms with a dedicated "Site of the Day" interactive score tracker.

---

## 🧠 Core Machine Learning Pipelines

### 1. TF-IDF Content Profiling
Computes Inverse Document Frequency (IDF) for all movie genre tags:
$$\text{idf}(g) = 1 + \ln\left(\frac{1 + |U|}{1 + |\{u \in U \mid g \in u\}|}\right)$$
Matches movie profiles with user ratings history weights through cosine similarity of dense multi-dimensional genre vectors.

### 2. SVD Matrix Factorization (Latent Collaborative Filtering)
Utilizes a singular value decomposition latent factor collaborative filtering algorithm, trained directly in runtime using **Stochastic Gradient Descent (SGD)** with parameters $\gamma$ (learning rate) and $\lambda$ (regularization rate):
$$\hat{r}_{u,i} = \mu + b_u + b_i + P_u^T Q_i$$
This is recalculated live on rating inputs to update the collaborative predictions instantly!

### 3. K-Means Cohort Segmentation
Segments user genre affinity vectors through Lloyd’s $K$-Means clustering ($k=4$). Projects multidimensional vectors down to custom user coordinates mapped dynamically to the interactive SVG scatter canvas:
* **The Crimson Blockbusters (Action/Sci-Fi)**
* **The Sapphire Cinephiles (Drama/Romance)**
* **The Amber Comedy Club (Comedy/Animation)**
* **The Emerald Detectives (Thriller/Mystery)**

---

## 🛠️ Tech Stack & Structure

* **Frontend**: React 19, Vite, Tailwind CSS, `motion/react` (animations)
* **Backend**: Express (custom Node server), TSX, Esbuild (production bundling)
* **ML Library**: Standard pure TS vectors and matrices calculations, custom SGD Matrix Factorization (SVD)
* **Explainable Recommendation Integration**: Google GenAI SDK (`@google/genai`) with dual-fallback, request caching, and model failure mitigation.

# Hybrid-recommendation-system---ML-Based
