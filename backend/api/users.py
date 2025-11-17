"""User management endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from schemas.user import CreateUserRequest, UserResponse, UserTasteProfileResponse
from dependencies import get_recommender
from recommender import SpectraRecommender
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", response_model=UserResponse, tags=["Users"])
async def create_user(
    request: CreateUserRequest,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Create a new user account."""
    try:
        user = recommender.db.user.create_user(
            email=request.email,
            username=request.username
        )
        return user
    except Exception as e:
        error_msg = str(e).lower()
        if "duplicate" in error_msg or "unique" in error_msg or "already exists" in error_msg:
            raise HTTPException(status_code=400, detail="User with this email or username already exists")
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}", response_model=UserResponse, tags=["Users"])
async def get_user(
    user_id: str,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Get user by ID."""
    try:
        user = recommender.db.user.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}/taste-profile", response_model=UserTasteProfileResponse, tags=["Users"])
async def get_user_taste_profile(
    user_id: str,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Get user's computed taste profile from ratings."""
    try:
        # Verify user exists
        user = recommender.db.user.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        profile = recommender.compute_user_taste_profile(user_id)
        if not profile:
            raise HTTPException(
                status_code=404,
                detail="User has no ratings yet. Rate some items to build your taste profile!"
            )
        
        return {
            'taste_vector': profile['taste_vector_8d'].tolist(),
            'breakdown': profile['breakdown'],
            'num_ratings': profile['num_ratings']
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user taste profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}/recommendations", tags=["Recommendations"])
async def get_user_recommendations(
    user_id: str,
    media_types: Optional[str] = None,
    top_k: int = 10,
    exclude_rated: bool = True,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Get personalized recommendations for a user based on their ratings."""
    try:
        # Verify user exists
        user = recommender.db.user.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Parse media_types from comma-separated string
        media_types_list = None
        if media_types:
            media_types_list = [t.strip() for t in media_types.split(',')]
        
        results = recommender.recommend_for_user(
            user_id=user_id,
            media_types=media_types_list,
            top_k=top_k,
            exclude_rated=exclude_rated
        )
        
        return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

