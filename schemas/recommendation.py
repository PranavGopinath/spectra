"""Recommendation-related Pydantic schemas."""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class RecommendRequest(BaseModel):
    query: str = Field(..., description="Text query or taste description")
    media_types: Optional[List[str]] = Field(
        default=None,
        description="List of media types to search (movie, music, book). None = all"
    )
    top_k: int = Field(default=10, ge=1, le=50, description="Number of results per media type")
    min_year: Optional[int] = Field(default=None, description="Minimum year filter")
    max_year: Optional[int] = Field(default=None, description="Maximum year filter")


class SimilarRequest(BaseModel):
    media_types: Optional[List[str]] = Field(
        default=None,
        description="List of media types to search"
    )
    top_k: int = Field(default=10, ge=1, le=50, description="Number of results per media type")


class ExplainRequest(BaseModel):
    item_id: str = Field(..., description="ID of the item to explain")
    taste_vector: List[float] = Field(..., min_length=8, max_length=8, description="User's taste vector (8D)")


class GenerateResponseRequest(BaseModel):
    user_input: str = Field(..., description="User's message")
    taste_analysis: Optional[Dict[str, Any]] = Field(default=None, description="Taste analysis result (optional)")
    conversation_history: Optional[List[Dict[str, str]]] = Field(default=None, description="Previous conversation messages")


class RecommendationItem(BaseModel):
    id: str
    title: str
    media_type: str
    year: Optional[int]
    description: str
    metadata: Dict[str, Any]
    similarity: float


class RecommendResponse(BaseModel):
    movie: Optional[List[RecommendationItem]] = []
    music: Optional[List[RecommendationItem]] = []
    book: Optional[List[RecommendationItem]] = []

