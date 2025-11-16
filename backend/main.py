"""FastAPI backend for Spectra recommendation engine."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging

from recommender import SpectraRecommender
from taste_dimensions import TASTE_DIMENSIONS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Spectra API",
    description="Cross-domain recommendation engine using 8D taste vectors",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global recommender instance (loaded once at startup)
recommender: Optional[SpectraRecommender] = None


# Pydantic Models
class TasteAnalysisRequest(BaseModel):
    text: str = Field(..., description="User's taste description in natural language")


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


class TasteAnalysisResponse(BaseModel):
    taste_vector: List[float]
    breakdown: List[Dict[str, Any]]


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


class DimensionInfo(BaseModel):
    name: str
    description: str
    positive_prompt: str
    negative_prompt: str
    examples: Dict[str, Dict[str, str]]  # e.g., {"movies": {"positive": "...", "negative": "..."}}


class StatsResponse(BaseModel):
    total: int
    movies: int
    music: int
    books: int


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool


# Startup/Shutdown Events
@app.on_event("startup")
async def startup_event():
    """Load the recommendation engine at startup."""
    global recommender
    logger.info("Loading Spectra recommendation engine...")
    try:
        recommender = SpectraRecommender()
        logger.info("✓ Recommendation engine loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load recommendation engine: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    global recommender
    if recommender:
        logger.info("Closing recommendation engine...")
        recommender.close()
        logger.info("✓ Recommendation engine closed")


# API Endpoints
@app.get("/", tags=["General"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Spectra API",
        "version": "1.0.0",
        "description": "Cross-domain recommendation engine",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse, tags=["General"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "ok",
        "model_loaded": recommender is not None
    }


@app.get("/api/dimensions", response_model=List[DimensionInfo], tags=["Taste"])
async def get_dimensions():
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


@app.post("/api/taste/analyze", response_model=TasteAnalysisResponse, tags=["Taste"])
async def analyze_taste(request: TasteAnalysisRequest):
    """Analyze user's taste from text input."""
    if not recommender:
        raise HTTPException(status_code=503, detail="Recommendation engine not available")
    
    try:
        result = recommender.analyze_taste(request.text)
        return result
    except Exception as e:
        logger.error(f"Error analyzing taste: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/recommend", tags=["Recommendations"])
async def get_recommendations(request: RecommendRequest):
    """Get recommendations based on taste query."""
    if not recommender:
        raise HTTPException(status_code=503, detail="Recommendation engine not available")
    
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


@app.post("/api/similar/{item_id}", tags=["Recommendations"])
async def find_similar(item_id: str, request: SimilarRequest):
    """Find items similar to a given item (cross-domain discovery)."""
    if not recommender:
        raise HTTPException(status_code=503, detail="Recommendation engine not available")
    
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


@app.get("/api/item/{item_id}", tags=["Items"])
async def get_item(item_id: str):
    """Get detailed information about a specific item."""
    if not recommender:
        raise HTTPException(status_code=503, detail="Recommendation engine not available")
    
    try:
        item = recommender.db.media.get_item_by_id(item_id)
        if not item:
            raise HTTPException(status_code=404, detail=f"Item {item_id} not found")
        
        # The database layer should handle conversions, but ensure JSON serialization works
        # Convert any remaining numpy arrays to lists
        import numpy as np
        if 'taste_vector' in item and item['taste_vector'] is not None:
            if isinstance(item['taste_vector'], np.ndarray):
                item['taste_vector'] = item['taste_vector'].tolist()
            elif hasattr(item['taste_vector'], 'tolist'):
                item['taste_vector'] = item['taste_vector'].tolist()
        
        return item
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting item: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/explain", tags=["Recommendations"])
async def explain_match(request: ExplainRequest):
    """Explain why an item matches the user's taste."""
    if not recommender:
        raise HTTPException(status_code=503, detail="Recommendation engine not available")
    
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


@app.get("/api/stats", response_model=StatsResponse, tags=["General"])
async def get_stats():
    """Get database statistics."""
    if not recommender:
        raise HTTPException(status_code=503, detail="Recommendation engine not available")
    
    try:
        return {
            "total": recommender.db.media.count_items(),
            "movies": recommender.db.media.count_items('movie'),
            "music": recommender.db.media.count_items('music'),
            "books": recommender.db.media.count_items('book')
        }
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Run with: uvicorn main:app --reload --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
