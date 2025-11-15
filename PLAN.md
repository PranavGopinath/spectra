# TasteGraph Build Plan

## Project Overview
Cross-domain recommendation engine using 8D taste vectors projected from OpenAI embeddings. Matches aesthetic and emotional preferences across movies, music, visual art, and books.

## Technical Approach
- Embed content descriptions using OpenAI (1536D)
- Define 8 taste dimensions as direction vectors in embedding space
- Project embeddings onto these 8 dimensions to get taste vectors (8D)
- Match users to content in interpretable 8D taste space (not raw 1536D)
- Enable cross-domain recommendations via shared aesthetic dimensions

## Core System Components

### 1. Taste Vector Model ✓ (Defined)
- [x] Define 8 taste dimensions (cross-domain compatible):
  1. **Emotional Tone** (dark/melancholic ↔ light/joyful)
  2. **Energy/Intensity** (calm/gentle ↔ intense/powerful)
  3. **Complexity** (simple/minimalist ↔ complex/layered)
  4. **Abstractness** (concrete/literal ↔ abstract/symbolic)
  5. **Aesthetic Style** (raw/gritty ↔ polished/refined)
  6. **Intellectualism** (intuitive/visceral ↔ cerebral/analytical)
  7. **Conventionality** (traditional/familiar ↔ experimental/avant-garde)
  8. **Worldview** (cynical/dark ↔ hopeful/optimistic)
- [ ] Create positive/negative prompt pairs for each dimension
- [ ] Generate direction vectors using OpenAI embeddings (1536D each)
- [ ] Normalize and store 8 direction vectors (backend/data/dimension_vectors.npy)

### 2. Media Embedding Store
- [ ] Set up data storage (JSON files for MVP, can migrate to pgvector later)
- [ ] Create unified media schema (id, title, type, year, description, image_url, embedding_1536d, taste_vector_8d)

#### Movies (200-300 items)
- [ ] Fetch from TMDB API
- [ ] Combine synopsis + reviews + genre keywords
- [ ] Generate 1536D embeddings
- [ ] Project to 8D taste vectors
- [ ] Store in backend/data/movies.json

#### Music (200-300 albums/artists)
- [ ] Fetch from Spotify API or Last.fm API
- [ ] Use artist bios + album descriptions + genre tags + reviews
- [ ] Generate embeddings and taste vectors
- [ ] Store in backend/data/music.json

#### Visual Art (200-300 works)
- [ ] Fetch from WikiArt API or museum collections
- [ ] Use artwork descriptions + artist info + movement/style tags
- [ ] Generate embeddings and taste vectors
- [ ] Store in backend/data/art.json

#### Books (200-300 titles)
- [ ] Fetch from Google Books API or OpenLibrary
- [ ] Use descriptions + reviews + genre info
- [ ] Generate embeddings and taste vectors
- [ ] Store in backend/data/books.json

### 3. Taste Analysis Engine
- [ ] Implement text input → 1536D embedding conversion (backend/taste_vector.py)
- [ ] Build projection system onto 8 taste direction vectors
- [ ] Calculate 8D user taste vector from input
- [ ] Handle multiple input types:
  - Natural language descriptions
  - List of favorite items
  - Manual dimension adjustment

### 4. Retrieval & Ranking System
- [ ] Implement cosine similarity search in 8D taste space
- [ ] Build ranking algorithm with dimension weighting
- [ ] Support multi-domain retrieval (return top-k per media type)
- [ ] Optimize for speed (numpy vectorization for MVP)
- [ ] Optional: Add FAISS index if scaling needed later

### 4.5. Hybrid Scoring System (Phase 1.5 - Optional Enhancement)
*Implement this if pure 8D taste matching doesn't capture genre/content preferences well enough*

- [ ] Add hybrid scoring to recommender.py
  - Compute both taste similarity (8D) and semantic similarity (1536D)
  - Implement weighted combination: `final_score = α * taste_score + (1-α) * semantic_score`
  - Default α = 0.7 (favor taste), but make it configurable
- [ ] Add `taste_weight` parameter to recommendation endpoint
  - Allow users/frontend to control taste vs content balance
  - `taste_weight=0.9` → Pure aesthetic matching (cross-domain discovery)
  - `taste_weight=0.5` → Balanced matching
  - `taste_weight=0.3` → Content-heavy matching (genre-focused)
- [ ] Update recommendation response to include both scores
  - Return `taste_score`, `semantic_score`, and `final_score` for transparency
  - Show in UI which type of match it is
- [ ] Smart query detection (advanced)
  - Detect genre mentions in user input ("detective", "sci-fi", "jazz")
  - Automatically adjust taste_weight when genre is mentioned
  - "I love detective stories" → reduce taste_weight to 0.3
  - "I love dark, intense vibes" → increase taste_weight to 0.9
- [ ] A/B test with users
  - Compare pure 8D vs hybrid recommendations
  - Measure user satisfaction and engagement
  - Decide if hybrid is worth the added complexity

**When to implement:**
- After MVP testing shows users want more genre/content matching
- If pure 8D gives too many "interesting but unexpected" cross-domain results
- When users explicitly request "more like X" (specific item matching)

**When to skip:**
- If pure 8D taste matching works well enough
- If cross-domain discovery is the main value proposition
- To keep MVP simple and focused

### 5. Backend API (FastAPI)
- [ ] Set up FastAPI project structure (backend/main.py)
- [ ] Create POST `/api/taste/analyze` endpoint
  - Input: user text description
  - Output: 8D taste vector + dimension breakdown
- [ ] Create POST `/api/recommend` endpoint
  - Input: taste vector or text, media types filter, top_k
  - Output: recommendations per media type with match scores
- [ ] Create GET `/api/dimensions` endpoint
  - Output: dimension definitions + examples across domains
- [ ] Create GET `/api/item/{media_type}/{id}` endpoint
  - Output: detailed item info + taste vector
- [ ] Add explanation generator for recommendations
  - Show which dimensions contributed to match
  - Natural language "Why this matches" text
- [ ] Implement error handling and validation
- [ ] Add OpenAI API rate limiting/caching

### 6. Frontend UI (Next.js)
- [ ] Set up Next.js project with TypeScript + Tailwind
- [ ] Create taste input page (frontend/app/page.tsx)
  - Textarea for preference description
  - Example prompts to guide users
  - Submit button to analyze
- [ ] Build 8D taste vector visualization (frontend/components/TasteRadar.tsx)
  - Radar chart showing all 8 dimensions
  - Use Chart.js or Recharts
  - Display dimension names and scores
- [ ] Create manual dimension adjustment interface (frontend/components/DimensionSliders.tsx)
  - 8 sliders (one per dimension)
  - Real-time recommendation updates
  - Reset to analyzed taste button
- [ ] Build recommendation display (frontend/components/RecommendationCard.tsx)
  - Cards with poster/cover images
  - Title, year/artist, media type
  - Match score visualization
  - "Why this match?" explanations
  - Organized by media type tabs
- [ ] Add loading states and error handling
- [ ] Implement responsive design

### 7. Advanced Features (Phase 2)
- [ ] Cross-domain similarity exploration
  - "Find music like this movie"
  - "Find books like this painting"
- [ ] User taste profiles (save/load)
  - Store taste vectors locally or in DB
  - Named profiles ("Work mood", "Weekend vibes")
- [ ] Taste evolution tracking over time
  - Chart how preferences change
  - Historical taste snapshots
- [ ] Hybrid scoring (optional)
  - Combine 8D taste matching with 1536D semantic similarity
  - Weighted blend for better accuracy
- [ ] Similar users discovery
  - Find people with similar taste vectors
  - Collaborative filtering layer
- [ ] Export taste profile as shareable link
  - Encode 8D vector in URL
  - Social sharing features

### 8. Deployment & Polish
- [ ] Set up environment variables (.env files)
- [ ] Add API documentation (OpenAPI/Swagger)
- [ ] Deploy backend to Render/Railway
  - Set OpenAI API key
  - Configure CORS
- [ ] Deploy frontend to Vercel
  - Set backend API URL
- [ ] Create demo video/screenshots
- [ ] Write comprehensive README with:
  - Project description and motivation
  - Technical approach explanation
  - How taste vectors work
  - API documentation
  - Setup instructions
  - Example queries

## Data Sources

### Movies
- TMDB API (https://www.themoviedb.org/documentation/api)
- Goal: 200-300 diverse films across genres/eras

### Music
- Spotify API (https://developer.spotify.com/documentation/web-api)
- Last.fm API (https://www.last.fm/api)
- Goal: 200-300 albums/artists across genres

### Visual Art
- WikiArt API or scraped museum collections
- Goal: 200-300 artworks across movements/styles

### Books
- Google Books API (https://developers.google.com/books)
- OpenLibrary API (https://openlibrary.org/developers/api)
- Goal: 200-300 books across genres/periods

## Project Structure