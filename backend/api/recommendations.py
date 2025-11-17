"""Recommendation endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from schemas.recommendation import RecommendRequest, SimilarRequest, ExplainRequest, GenerateResponseRequest
from dependencies import get_recommender
from recommender import SpectraRecommender
from typing import Optional
import logging
import random

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", tags=["Recommendations"])
async def get_recommendations(
    request: RecommendRequest,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Get recommendations based on taste query."""
    try:
        results = recommender.recommend(
            query=request.query,
            media_types=request.media_types,
            top_k=request.top_k,
            min_year=request.min_year,
            max_year=request.max_year
        )
        return results
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/similar/{item_id}", tags=["Recommendations"])
async def find_similar(
    item_id: str,
    request: SimilarRequest,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Find items similar to a given item (cross-domain discovery)."""
    try:
        results = recommender.find_similar(
            item_id=item_id,
            media_types=request.media_types,
            top_k=request.top_k
        )
        return results
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error finding similar items: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/explain", tags=["Recommendations"])
async def explain_match(
    request: ExplainRequest,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Explain why an item matches the user's taste."""
    try:
        explanation = recommender.explain_match(
            item_id=request.item_id,
            user_taste_vector=request.taste_vector
        )
        return explanation
    except ValueError as e:
        error_msg = str(e)
        # Check if it's an item not found error or a validation error
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        else:
            # Validation error (e.g., wrong vector length)
            raise HTTPException(status_code=422, detail=error_msg)
    except Exception as e:
        logger.error(f"Error explaining match: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-response", tags=["Chat"])
async def generate_response(
    request: GenerateResponseRequest,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Generate a brief intro for recommendations using template-based approach."""
    # Template-based generation (fast, instant response)
    # Extract keywords from user input for personalized intro
    user_input = request.user_input.lower()
    
    # Extract key terms
    common_words = {'i', 'love', 'like', 'enjoy', 'want', 'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'am'}
    words = [w for w in user_input.split() if w not in common_words and len(w) > 3]
    keywords = words[:3]  # Take first 3 meaningful words
    
    # Generate intro based on keywords
    templates = [
        "Based on your interest in {keyword}, here are some recommendations:",
        "I found some great {keyword} recommendations for you:",
        "Here are some {keyword} picks based on your preferences:",
        "Based on your love of {keyword}, I think you'll enjoy these:",
    ]
    
    if keywords:
        template = random.choice(templates)
        intro = template.format(keyword=keywords[0])
    else:
        intro = "Here are some recommendations based on your preferences:"
    
    return {
        "response": intro
    }

