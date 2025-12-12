"""Taste analysis-related Pydantic schemas."""

from pydantic import BaseModel, Field
from typing import List, Dict, Any


class TasteAnalysisRequest(BaseModel):
    text: str = Field(..., description="User's taste description in natural language")


class TasteAnalysisResponse(BaseModel):
    taste_vector: List[float]
    breakdown: List[Dict[str, Any]]


class DimensionInfo(BaseModel):
    name: str
    description: str
    positive_prompt: str
    negative_prompt: str
    examples: Dict[str, Dict[str, str]]  # e.g., {"movies": {"positive": "...", "negative": "..."}}

