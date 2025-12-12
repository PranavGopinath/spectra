"""Authentication-related Pydantic schemas."""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional


class RegisterRequest(BaseModel):
    """Request schema for user registration."""
    email: EmailStr = Field(..., description="User email address")
    username: Optional[str] = Field(default=None, description="Optional username")
    password: str = Field(..., min_length=8, description="Password (minimum 8 characters)")


class LoginRequest(BaseModel):
    """Request schema for user login."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class TokenResponse(BaseModel):
    """Response schema for authentication tokens."""
    access_token: str
    token_type: str = "bearer"
    user: dict  # UserResponse data


class OAuthInitiateRequest(BaseModel):
    """Request to initiate OAuth flow."""
    provider: str = Field(..., description="OAuth provider (google or github)")


class OAuthCallbackRequest(BaseModel):
    """Request schema for OAuth callback."""
    provider: str = Field(..., description="OAuth provider")
    code: str = Field(..., description="OAuth authorization code")
    state: Optional[str] = Field(default=None, description="OAuth state parameter")

