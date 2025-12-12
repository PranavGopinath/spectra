"""General endpoints (health, stats, root)."""

from fastapi import APIRouter, Depends
from schemas.general import HealthResponse, StatsResponse
from dependencies import get_recommender
from recommender import SpectraRecommender
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", tags=["General"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Spectra API",
        "version": "1.0.0",
        "description": "Cross-domain recommendation engine",
        "docs": "/docs",
        "health": "/health"
    }


@router.get("/health", response_model=HealthResponse, tags=["General"])
async def health_check(
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Health check endpoint for monitoring."""
    return {
        "status": "ok",
        "model_loaded": recommender is not None
    }


@router.get("/stats", response_model=StatsResponse, tags=["General"])
async def get_stats(
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Get database statistics."""
    try:
        return {
            "total": recommender.db.media.count_items(),
            "movies": recommender.db.media.count_items('movie'),
            "music": recommender.db.media.count_items('music'),
            "books": recommender.db.media.count_items('book')
        }
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise

