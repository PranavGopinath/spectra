"""Item endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from dependencies import get_recommender
from recommender import SpectraRecommender
import numpy as np
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


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

