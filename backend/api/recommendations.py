"""Recommendation endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from schemas.recommendation import RecommendRequest, SimilarRequest, ExplainRequest, GenerateResponseRequest
from dependencies import get_recommender
from recommender import SpectraRecommender
from typing import Optional, List
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


def detect_media_type(user_input: str) -> Optional[List[str]]:
    """Detect media type(s) from user input."""
    user_input_lower = user_input.lower()
    
    # Media type keywords
    movie_keywords = {'movie', 'movies', 'film', 'films', 'cinema', 'cinematic', 'director', 'actor', 'actress', 'watch', 'watching'}
    music_keywords = {'music', 'song', 'songs', 'album', 'albums', 'artist', 'band', 'musician', 'listen', 'listening', 'audio', 'track', 'tracks'}
    book_keywords = {'book', 'books', 'novel', 'novels', 'author', 'read', 'reading', 'literature', 'chapter', 'chapters'}
    
    detected_types = []
    
    # Check for each media type
    if any(keyword in user_input_lower for keyword in movie_keywords):
        detected_types.append('movie')
    if any(keyword in user_input_lower for keyword in music_keywords):
        detected_types.append('music')
    if any(keyword in user_input_lower for keyword in book_keywords):
        detected_types.append('book')
    
    # Return None if no specific type detected (means search all types)
    return detected_types if detected_types else None


@router.post("/generate-response", tags=["Chat"])
async def generate_response(
    request: GenerateResponseRequest,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Generate a brief intro for recommendations using template-based approach."""
    # Detect media type from query
    detected_media_types = detect_media_type(request.user_input)
    
    # Generic response templates (no keyword interpolation)
    templates = [
        "Here are some recommendations I think you'll enjoy:",
        "I found some great picks for you:",
        "Based on your preferences, here are some recommendations:",
        "Here are some recommendations that might resonate with you:",
        "I've curated some recommendations based on what you're looking for:",
    ]
    
    intro = random.choice(templates)
    
    return {
        "response": intro,
        "detected_media_types": detected_media_types
    }

