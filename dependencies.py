"""Shared dependencies for FastAPI routes."""

from fastapi import HTTPException
from typing import Optional
from recommender import SpectraRecommender
import logging

logger = logging.getLogger(__name__)

# Global recommender instance (loaded once at startup)
_recommender: Optional[SpectraRecommender] = None


def set_recommender(recommender: SpectraRecommender):
    """Set the global recommender instance (called at startup)."""
    global _recommender
    _recommender = recommender


def get_recommender() -> SpectraRecommender:
    """Get the recommender instance (dependency injection)."""
    if _recommender is None:
        raise HTTPException(status_code=503, detail="Recommendation engine not available")
    return _recommender

