"""Taste analysis endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from schemas.taste import TasteAnalysisRequest, TasteAnalysisResponse, DimensionInfo
from dependencies import get_recommender
from recommender import SpectraRecommender
from taste_dimensions import TASTE_DIMENSIONS
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/dimensions", response_model=list[DimensionInfo], tags=["Taste"])
async def get_dimensions(
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Get information about all 8 taste dimensions."""
    return [
        {
            "name": dim["name"],
            "description": dim["description"],
            "positive_prompt": dim["positive_prompt"],
            "negative_prompt": dim["negative_prompt"],
            "examples": dim["examples"]
        }
        for dim in TASTE_DIMENSIONS
    ]


@router.post("/analyze", response_model=TasteAnalysisResponse, tags=["Taste"])
async def analyze_taste(
    request: TasteAnalysisRequest,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Analyze user's taste from text input."""
    try:
        result = recommender.analyze_taste(request.text)
        return result
    except Exception as e:
        logger.error(f"Error analyzing taste: {e}")
        raise HTTPException(status_code=500, detail=str(e))

