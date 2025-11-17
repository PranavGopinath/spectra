"""FastAPI backend for Spectra recommendation engine."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from recommender import SpectraRecommender
from dependencies import set_recommender

# Import API routers
from api import users, ratings, recommendations, taste, items, general, auth

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Spectra API",
    description="Cross-domain recommendation engine using 8D taste vectors",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(general.router, tags=["General"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(taste.router, prefix="/api/taste", tags=["Taste"])
app.include_router(recommendations.router, prefix="/api/recommend", tags=["Recommendations"])
app.include_router(recommendations.router, prefix="/api", tags=["Chat"])  # For /api/generate-response
app.include_router(items.router, prefix="/api/item", tags=["Items"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(ratings.router, prefix="/api/users/{user_id}/ratings", tags=["Ratings"])

# Startup/Shutdown Events
@app.on_event("startup")
async def startup_event():
    """Load the recommendation engine at startup."""
    logger.info("Loading Spectra recommendation engine...")
    try:
        recommender = SpectraRecommender()
        set_recommender(recommender)
        logger.info("✓ Recommendation engine loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load recommendation engine: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    from dependencies import get_recommender
    try:
        recommender = get_recommender()
        logger.info("Closing recommendation engine...")
        recommender.close()
        logger.info("✓ Recommendation engine closed")
    except Exception:
        pass  # Recommender not loaded or already closed


# Run with: uvicorn main:app --reload --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
