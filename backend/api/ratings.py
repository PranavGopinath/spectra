"""Rating endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from schemas.rating import RatingRequest, RatingResponse, UserRatingsResponse
from dependencies import get_recommender
from recommender import SpectraRecommender
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", response_model=RatingResponse, tags=["Ratings"])
async def add_rating(
    user_id: str,
    request: RatingRequest,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Add or update a rating for an item."""
    try:
        # Verify user exists
        user = recommender.db.user.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify item exists
        item = recommender.db.media.get_item_by_id(request.item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Add/update rating
        rating = recommender.db.user.add_rating(
            user_id=user_id,
            item_id=request.item_id,
            rating=request.rating,
            notes=request.notes,
            favorite=request.favorite,
            want_to_consume=request.want_to_consume
        )
        return rating
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding rating: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=UserRatingsResponse, tags=["Ratings"])
async def get_user_ratings(
    user_id: str,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Get all ratings for a user."""
    try:
        # Verify user exists
        user = recommender.db.user.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        ratings = recommender.db.user.get_user_ratings(user_id)

        # Drop entries that have no numeric rating to avoid response validation errors
        cleaned_ratings = [r for r in ratings if r.get("rating") is not None]

        return {"ratings": cleaned_ratings}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user ratings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{item_id}", tags=["Ratings"])
async def delete_rating(
    user_id: str,
    item_id: str,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Delete a rating."""
    try:
        # Verify user exists
        user = recommender.db.user.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        deleted = recommender.db.user.delete_rating(user_id, item_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Rating not found")
        
        return {"success": True, "message": "Rating deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting rating: {e}")
        raise HTTPException(status_code=500, detail=str(e))

