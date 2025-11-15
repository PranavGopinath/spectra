# Scrapers

Data fetching scripts for different media types.

## Setup

### 1. TMDB API Key (Movies)

1. Go to https://www.themoviedb.org/settings/api
2. Sign up for a free account
3. Request an API key (choose "Developer" option)
4. Add to `backend/.env`:

```
TMDB_API_KEY=your_api_key_here
```

### 2. Last.fm API Key (Music)

1. Go to https://www.last.fm/api/account/create
2. Sign up or log in
3. Create an API account (simple form)
4. Copy your API key
5. Add to `backend/.env`:

```
LASTFM_API_KEY=your_api_key_here
```

## Usage

### Fetch Movies

```bash
cd backend
python scrapers/movies.py
```

This will:
- Fetch 250 popular & top-rated movies from TMDB
- Generate embeddings & taste vectors
- Store in PostgreSQL database

### Fetch Music

```bash
cd backend
python scrapers/music.py
```

This will:
- Fetch 250 diverse artists from Last.fm
- Includes top artists + artists from various genres
- Generate embeddings & taste vectors from bios and metadata
- Store in PostgreSQL database

### Fetch Books

```bash
cd backend
python scrapers/books.py
```

This will:
- Fetch 250 diverse books from Google Books API
- Includes books from 19 different genres (fiction, mystery, sci-fi, philosophy, etc.)
- Generate embeddings & taste vectors from descriptions and metadata
- Store in PostgreSQL database
- **Note**: No API key required! (but optional for higher rate limits)

