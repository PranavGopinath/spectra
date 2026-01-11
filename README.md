# Spectra

A recommendation engine that finds movies, music, and books with similar vibes across different genres.

**Key Features:**
- Rate & Review media to build your taste profile
- Get personalized recommendations across movies, music, and books
- See your taste visualized as a cool radar chart

## Quick Start


Start everything with one command:

```bash
docker-compose up --build
```

This will start:
- PostgreSQL database (port 5432)
- Backend API (port 8000)
- Frontend app (port 3000)

Visit `http://localhost:3000` once all services are running.

### Manual Setup

To run services separately:

#### Backend

```bash
cd backend
python3 -m venv ../.venv
source ../.venv/bin/activate
pip install -r requirements.txt
cd ..
docker-compose up -d  # Start PostgreSQL only
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`


## Project Structure

```
spectra/
├── backend/          # FastAPI server
├── frontend/        # Next.js app
├── docker-compose.yml
```

