"""Rating-related Pydantic schemas."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union


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
    rating: Optional[int]
    notes: Optional[str]
    favorite: Optional[bool]
    want_to_consume: Optional[bool]
    created_at: Optional[str]
    updated_at: Optional[str]


class UserRatingWithItem(BaseModel):
    id: str
    item_id: str
    rating: Union[int, None] = Field(default=None, description="Rating from 1-5, or None if not rated")
    notes: Optional[str] = None
    favorite: Optional[bool] = None
    want_to_consume: Optional[bool] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    item: Dict[str, Any]
    
    class Config:
        # Allow None values for optional fields
        from_attributes = True


class UserRatingsResponse(BaseModel):
    ratings: List[UserRatingWithItem]

