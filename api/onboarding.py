"""Onboarding endpoints for new user preference selection."""

from fastapi import APIRouter, HTTPException, Depends
from schemas.onboarding import OnboardingItemsResponse, SubmitPreferencesRequest, SubmitPreferencesResponse
from dependencies import get_recommender
from recommender import SpectraRecommender
import logging
import random

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/items", response_model=OnboardingItemsResponse, tags=["Onboarding"])
async def get_onboarding_items(
    recommender: SpectraRecommender = Depends(get_recommender),
    limit_per_type: int = 100
):
    """Get a selection of items from movies, books, and music for onboarding."""
    try:
        # Get items from each media type
        movies = recommender.db.media.get_all_by_type('movie', limit=limit_per_type * 2)
        books = recommender.db.media.get_all_by_type('book', limit=limit_per_type * 2)
        music = recommender.db.media.get_all_by_type('music', limit=limit_per_type * 2)
        
        # Randomly sample to get diverse selection
        movies_sample = random.sample(movies, min(limit_per_type, len(movies))) if len(movies) > limit_per_type else movies
        books_sample = random.sample(books, min(limit_per_type, len(books))) if len(books) > limit_per_type else books
        music_sample = random.sample(music, min(limit_per_type, len(music))) if len(music) > limit_per_type else music
        
        return {
            "movies": movies_sample,
            "books": books_sample,
            "music": music_sample
        }
    except Exception as e:
        logger.error(f"Error getting onboarding items: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{user_id}/preferences", response_model=SubmitPreferencesResponse, tags=["Onboarding"])
async def submit_initial_preferences(
    user_id: str,
    request: SubmitPreferencesRequest,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Submit initial preferences for a new user during onboarding."""
    try:
        # Verify user exists
        user = recommender.db.user.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Validate that user has rated at least 1 item from each category
        rated_items = {}
        for rating in request.ratings:
            item = recommender.db.media.get_item_by_id(rating.item_id)
            if not item:
                logger.warning(f"Item {rating.item_id} not found, skipping")
                continue
            media_type = item.get('media_type')
            if media_type and media_type in ['movie', 'book', 'music']:
                if media_type not in rated_items:
                    rated_items[media_type] = []
                rated_items[media_type].append(rating)
        
        # Check minimum requirements
        if 'movie' not in rated_items or len(rated_items['movie']) == 0:
            raise HTTPException(status_code=400, detail="Please rate at least 1 movie")
        if 'book' not in rated_items or len(rated_items['book']) == 0:
            raise HTTPException(status_code=400, detail="Please rate at least 1 book")
        if 'music' not in rated_items or len(rated_items['music']) == 0:
            raise HTTPException(status_code=400, detail="Please rate at least 1 music/artist")
        
        # Add ratings for each rated item
        added_count = 0
        for rating in request.ratings:
            # Verify item exists
            item = recommender.db.media.get_item_by_id(rating.item_id)
            if not item:
                logger.warning(f"Item {rating.item_id} not found, skipping")
                continue
            
            # Add rating with user-provided rating value
            recommender.db.user.add_rating(
                user_id=user_id,
                item_id=rating.item_id,
                rating=rating.rating,
                notes=None,
                favorite=None,  # Don't auto-mark as favorite, let user decide
                want_to_consume=None
            )
            added_count += 1
        
        return {
            "success": True,
            "message": f"Added {added_count} ratings",
            "items_added": added_count
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))

