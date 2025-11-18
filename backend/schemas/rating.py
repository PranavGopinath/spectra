"""Rating-related Pydantic schemas."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class RatingRequest(BaseModel):
    item_id: str = Field(..., description="Media item ID")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1-5")
    notes: Optional[str] = Field(default=None, description="Optional notes/comments")
    favorite: Optional[bool] = Field(default=None, description="Mark as favorite")
    want_to_consume: Optional[bool] = Field(default=None, description="Add to My List")


class RatingResponse(BaseModel):
    id: str
    user_id: str
    item_id: str
    rating: int
    notes: Optional[str]
    favorite: Optional[bool]
    want_to_consume: Optional[bool]
    created_at: Optional[str]
    updated_at: Optional[str]


class UserRatingWithItem(BaseModel):
    id: str
    item_id: str
    rating: int
    notes: Optional[str]
    favorite: Optional[bool]
    want_to_consume: Optional[bool]
    created_at: Optional[str]
    updated_at: Optional[str]
    item: Dict[str, Any]


class UserRatingsResponse(BaseModel):
    ratings: List[UserRatingWithItem]

