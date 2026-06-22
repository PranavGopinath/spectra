"""Onboarding endpoints for new user preference selection."""

from fastapi import APIRouter, HTTPException, Depends
from schemas.onboarding import OnboardingItemsResponse, SubmitPreferencesRequest, SubmitPreferencesResponse
from dependencies import get_recommender
from recommender import SpectraRecommender
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/items", response_model=OnboardingItemsResponse, tags=["Onboarding"])
async def get_onboarding_items(
    recommender: SpectraRecommender = Depends(get_recommender),
    limit_per_type: int = 1000
):
    """Get popularity-sorted items from movies, books, and music for onboarding."""
    try:
        movies = recommender.db.media.get_popular_by_type('movie', limit=limit_per_type)
        books = recommender.db.media.get_popular_by_type('book', limit=limit_per_type)
        music = recommender.db.media.get_popular_by_type('music', limit=limit_per_type)

        return {
            "movies": movies,
            "books": books,
            "music": music,
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
        if len(rated_items) == 0:
            raise HTTPException(status_code=400, detail="Please rate at least 1 item")
        
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

