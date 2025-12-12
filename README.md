# Spectra

A recommendation engine that finds movies, music, and books with similar vibes across different genres.

**Key Features:**
- Rate items (1-5 stars) to build your taste profile
- Get personalized recommendations across movies, music, and books
- See your taste visualized as a cool radar chart
- Discover content that *feels* similar, regardless of type

## Quick Start

### Backend

```bash
cd backend
python3 -m venv ../.venv
source ../.venv/bin/activate
pip install -r requirements.txt
cd ..
docker-compose up -d  # Start PostgreSQL
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`

## How It Works

1. **Rate items** you've watched/listened to/read (1-5 stars)
2. **System learns** your preferences from your ratings
3. **Get recommendations** based on what you love
4. **Discover** new content across movies, music, and books

Your taste profile is built from your ratings—higher ratings influence recommendations more. The system uses semantic embeddings to understand what you love, then finds similar content across different domains.

## Tech Stack

- **Backend**: FastAPI, PostgreSQL + pgvector, Sentence Transformers
- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Matching**: 384D semantic embeddings for accurate recommendations

## Project Structure

```
spectra/
├── backend/          # FastAPI server
├── frontend/        # Next.js app
├── docker-compose.yml
```

## License

Open source
