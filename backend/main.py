"""FastAPI backend for Spectra recommendation engine."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager
import logging
from dotenv import load_dotenv
import os

load_dotenv()

from recommender import SpectraRecommender
from dependencies import set_recommender

from api import users, ratings, recommendations, taste, items, general, auth, onboarding

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup
    logger.info("Running database migrations...")
    try:
        from db.migrations.migrate import run_migrations
        run_migrations()
        logger.info("✓ Database migrations complete")
    except Exception as e:
        logger.error(f"Failed to run migrations: {e}")
        raise
    
    logger.info("Loading Spectra recommendation engine...")
    try:
        recommender = SpectraRecommender()
        set_recommender(recommender)
        logger.info("✓ Recommendation engine loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load recommendation engine: {e}")
        raise
    
    yield  # App runs here
    
    # Shutdown
    from dependencies import get_recommender
    try:
        recommender = get_recommender()
        logger.info("Closing recommendation engine...")
        recommender.close()
        logger.info("✓ Recommendation engine closed")
    except Exception:
        pass  

# Initialize FastAPI app
app = FastAPI(
    title="Spectra API",
    description="Cross-domain recommendation engine using 8D taste vectors",
    version="1.0.0",
    lifespan=lifespan
)

# Session middleware (required for OAuth)
SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY", os.getenv("JWT_SECRET_KEY", "change-this-secret-key-in-production"))
app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET_KEY,
    max_age=3600, 
    same_site="lax"
)

# CORS configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(general.router, tags=["General"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(taste.router, prefix="/api/taste", tags=["Taste"])
app.include_router(recommendations.router, prefix="/api/recommend", tags=["Recommendations"])
app.include_router(recommendations.router, prefix="/api", tags=["Chat"])  
app.include_router(items.router, prefix="/api/item", tags=["Items"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(ratings.router, prefix="/api/users/{user_id}/ratings", tags=["Ratings"])
app.include_router(onboarding.router, prefix="/api/onboarding", tags=["Onboarding"])


# Run with: uvicorn main:app --reload --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)