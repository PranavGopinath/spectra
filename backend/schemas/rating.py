"""Rating-related Pydantic schemas."""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Dict, Any


class RatingRequest(BaseModel):
    item_id: str = Field(..., description="Media item ID")
    rating: Optional[int] = Field(default=None, ge=1, le=5, description="Rating from 1-5 (optional)")
    notes: Optional[str] = Field(default=None, description="Optional notes/comments")
    favorite: Optional[bool] = Field(default=None, description="Mark as favorite")
    want_to_consume: Optional[bool] = Field(default=None, description="Add to My List")


class RatingResponse(BaseModel):
    id: str
    user_id: str
    item_id: str
    rating: Optional[int] = None
    notes: Optional[str] = None
    favorite: Optional[bool] = None
    want_to_consume: Optional[bool] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class UserRatingWithItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    item_id: str
    rating: Optional[int] = None  # Allow None for items without ratings
    notes: Optional[str] = None
    favorite: Optional[bool] = None
    want_to_consume: Optional[bool] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    item: Dict[str, Any]


class UserRatingsResponse(BaseModel):
    ratings: List[UserRatingWithItem]

