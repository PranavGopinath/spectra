"""User-related Pydantic schemas."""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any


class CreateUserRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    username: Optional[str] = Field(default=None, description="Optional username")


class UserResponse(BaseModel):
    id: str
    email: str
    username: Optional[str]
    created_at: Optional[str]


class UserTasteProfileResponse(BaseModel):
    taste_vector: List[float]
    breakdown: List[Dict[str, Any]]
    num_ratings: int

