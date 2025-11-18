"""Onboarding-related Pydantic schemas."""

from pydantic import BaseModel, Field
from typing import List, Dict, Any


class MediaItem(BaseModel):
    """Simplified media item for onboarding."""
    id: str
    title: str
    media_type: str
    year: int | None = None
    description: str | None = None
    metadata: Dict[str, Any] | None = None


class OnboardingItemsResponse(BaseModel):
    """Response containing items for onboarding selection."""
    movies: List[MediaItem]
    books: List[MediaItem]
    music: List[MediaItem]


class OnboardingRating(BaseModel):
    """A single rating during onboarding."""
    item_id: str = Field(..., description="Item ID")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1-5")


class SubmitPreferencesRequest(BaseModel):
    """Request to submit initial preferences with ratings."""
    ratings: List[OnboardingRating] = Field(..., min_length=1, description="List of item ratings")


class SubmitPreferencesResponse(BaseModel):
    """Response after submitting preferences."""
    success: bool
    message: str
    items_added: int

