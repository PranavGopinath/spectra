"""Item endpoints."""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from dependencies import get_recommender
from recommender import SpectraRecommender
import numpy as np
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", tags=["Items"])
async def list_items(
    media_type: Optional[str] = Query(None, description="Filter by media type (movie, book, music)"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """List all items, optionally filtered by media type."""
    try:
        if media_type:
            items = recommender.db.media.get_all_by_type(media_type, limit=limit + offset)
            # Apply offset manually since get_all_by_type doesn't support it
            items = items[offset:offset + limit]
        else:
            # Get items from all types
            movies = recommender.db.media.get_all_by_type('movie', limit=limit + offset)
            books = recommender.db.media.get_all_by_type('book', limit=limit + offset)
            music = recommender.db.media.get_all_by_type('music', limit=limit + offset)
            
            # Combine and sort by title, then apply offset/limit
            all_items = movies + books + music
            all_items.sort(key=lambda x: x.get('title', ''))
            items = all_items[offset:offset + limit]
        
        return {
            "items": items,
            "total": len(items),
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        logger.error(f"Error listing items: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{item_id}", tags=["Items"])
async def get_item(
    item_id: str,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Get detailed information about a specific item."""
    try:
        item = recommender.db.media.get_item_by_id(item_id)
        if not item:
            raise HTTPException(status_code=404, detail=f"Item {item_id} not found")
        
        # The database layer should handle conversions, but ensure JSON serialization works
        # Convert any remaining numpy arrays to lists
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

