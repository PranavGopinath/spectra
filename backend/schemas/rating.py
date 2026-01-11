"""Rating-related Pydantic schemas."""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Dict, Any


class RatingRequest(BaseModel):
    item_id: str = Field(..., description="Media item ID")
    rating: Optional[float] = Field(
        default=None, 
        ge=0.5, 
        le=5.0, 
        description="Rating from 0.5 to 5.0 in 0.5 increments (optional)"
    )
    notes: Optional[str] = Field(default=None, description="Optional notes/comments")
    favorite: Optional[bool] = Field(default=None, description="Mark as favorite")
    want_to_consume: Optional[bool] = Field(default=None, description="Add to My List")
    
    @field_validator('rating')
    @classmethod
    def validate_rating_increment(cls, v):
        """Ensure rating is in 0.5 increments if provided."""
        if v is not None:
            # Check if v is a multiple of 0.5
            if (v * 2) % 1 != 0:
                raise ValueError('Rating must be in 0.5 increments (e.g., 1.0, 1.5, 2.0, ..., 5.0)')
        return v


class RatingResponse(BaseModel):
    id: str
    user_id: str
    item_id: str
    rating: Optional[float] = None
    notes: Optional[str] = None
    favorite: Optional[bool] = None
    want_to_consume: Optional[bool] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class UserRatingWithItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    item_id: str
    rating: Optional[float] = None  # Allow None for items without ratings, supports 0.5 increments
    notes: Optional[str] = None
    favorite: Optional[bool] = None
    want_to_consume: Optional[bool] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    item: Dict[str, Any]


class UserRatingsResponse(BaseModel):
    ratings: List[UserRatingWithItem]

