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
    limit_per_type: int = 30
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
        
        # Add ratings for each selected item
        # Use rating 5 (highest) for items the user likes during onboarding
        added_count = 0
        for item_id in request.item_ids:
            # Verify item exists
            item = recommender.db.media.get_item_by_id(item_id)
            if not item:
                logger.warning(f"Item {item_id} not found, skipping")
                continue
            
            # Add rating with high score (5) since user selected it as a preference
            recommender.db.user.add_rating(
                user_id=user_id,
                item_id=item_id,
                rating=5,  # High rating for onboarding preferences
                notes=None,
                favorite=True,  # Mark as favorite since user selected it
                want_to_consume=False
            )
            added_count += 1
        
        return {
            "success": True,
            "message": f"Added {added_count} preferences",
            "items_added": added_count
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))

