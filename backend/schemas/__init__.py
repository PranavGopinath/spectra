"""Pydantic schemas for API requests and responses."""

from schemas.user import CreateUserRequest, UserResponse, UserTasteProfileResponse
from schemas.rating import RatingRequest, RatingResponse, UserRatingWithItem, UserRatingsResponse
from schemas.recommendation import (
    RecommendRequest, SimilarRequest, ExplainRequest, GenerateResponseRequest,
    RecommendationItem, RecommendResponse
)
from schemas.taste import TasteAnalysisRequest, TasteAnalysisResponse, DimensionInfo
from schemas.general import HealthResponse, StatsResponse

__all__ = [
    # User schemas
    "CreateUserRequest",
    "UserResponse",
    "UserTasteProfileResponse",
    # Rating schemas
    "RatingRequest",
    "RatingResponse",
    "UserRatingWithItem",
    "UserRatingsResponse",
    # Recommendation schemas
    "RecommendRequest",
    "SimilarRequest",
    "ExplainRequest",
    "GenerateResponseRequest",
    "RecommendationItem",
    "RecommendResponse",
    # Taste schemas
    "TasteAnalysisRequest",
    "TasteAnalysisResponse",
    "DimensionInfo",
    # General schemas
    "HealthResponse",
    "StatsResponse",
]

