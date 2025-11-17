"""Authentication endpoints for login, registration, and OAuth."""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from schemas.auth import RegisterRequest, LoginRequest, TokenResponse, OAuthCallbackRequest
from schemas.user import UserResponse
from dependencies import get_recommender
from recommender import SpectraRecommender
from auth import verify_password, get_password_hash, create_access_token, decode_access_token
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter()

# OAuth configuration
config = Config()
oauth = OAuth(config)

# Register OAuth providers
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    oauth.register(
        name='google',
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'}
    )

if GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET:
    oauth.register(
        name='github',
        client_id=GITHUB_CLIENT_ID,
        client_secret=GITHUB_CLIENT_SECRET,
        authorize_url='https://github.com/login/oauth/authorize',
        access_token_url='https://github.com/login/oauth/access_token',
        client_kwargs={'scope': 'user:email'}
    )


@router.post("/register", response_model=TokenResponse, tags=["Auth"])
async def register(
    request: RegisterRequest,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Register a new user with email and password."""
    try:
        # Check if user already exists
        existing_user = recommender.db.user.get_user_by_email(request.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        # Hash password
        password_hash = get_password_hash(request.password)
        
        # Create user
        user = recommender.db.user.create_user(
            email=request.email,
            username=request.username,
            password_hash=password_hash,
            oauth_provider=None,
            oauth_id=None
        )
        
        # Create access token
        access_token = create_access_token(data={"sub": user['id'], "email": user['email']})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user['id'],
                "email": user['email'],
                "username": user['username'],
                "created_at": user['created_at']
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=TokenResponse, tags=["Auth"])
async def login(
    request: LoginRequest,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Login with email and password."""
    try:
        # Get user with password hash
        user = recommender.db.user.get_user_with_password(request.email)
        if not user:
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        
        # Check if user has password auth (not OAuth-only)
        if not user.get('password_hash'):
            raise HTTPException(status_code=400, detail="This account uses OAuth login. Please sign in with your OAuth provider.")
        
        # Verify password
        if not verify_password(request.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        
        # Create access token
        access_token = create_access_token(data={"sub": user['id'], "email": user['email']})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user['id'],
                "email": user['email'],
                "username": user['username'],
                "created_at": user['created_at']
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error logging in: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/oauth/{provider}/authorize", tags=["Auth"])
async def oauth_authorize(
    provider: str,
    request: Request,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Initiate OAuth flow."""
    if provider not in ['google', 'github']:
        raise HTTPException(status_code=400, detail="Invalid OAuth provider")
    
    if provider == 'google' and not (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET):
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    if provider == 'github' and not (GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET):
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
    
    # OAuth callback goes to backend, which then redirects to frontend
    redirect_uri = f"{os.getenv('BACKEND_URL', 'http://localhost:8000')}/api/auth/oauth/{provider}/callback"
    return await oauth.__getattr__(provider).authorize_redirect(request, redirect_uri)


@router.get("/oauth/{provider}/callback", tags=["Auth"])
async def oauth_callback(
    provider: str,
    request: Request,
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Handle OAuth callback and create/login user."""
    try:
        if provider not in ['google', 'github']:
            raise HTTPException(status_code=400, detail="Invalid OAuth provider")
        
        # Get token from OAuth provider
        token = await oauth.__getattr__(provider).authorize_access_token(request)
        
        # Get user info from provider
        if provider == 'google':
            user_info = token.get('userinfo')
            if not user_info:
                resp = await oauth.google.get('https://www.googleapis.com/oauth2/v2/userinfo', token=token)
                user_info = resp.json()
            
            oauth_id = user_info.get('sub')
            email = user_info.get('email')
            username = user_info.get('name') or user_info.get('given_name')
        else:  # github
            resp = await oauth.github.get('https://api.github.com/user', token=token)
            user_info = resp.json()
            
            oauth_id = str(user_info.get('id'))
            email = user_info.get('email')
            username = user_info.get('login') or user_info.get('name')
            
            # GitHub might not return email, need to fetch separately
            if not email:
                resp_emails = await oauth.github.get('https://api.github.com/user/emails', token=token)
                emails = resp_emails.json()
                email = next((e['email'] for e in emails if e.get('primary')), emails[0]['email'] if emails else None)
        
        if not email or not oauth_id:
            raise HTTPException(status_code=400, detail="Could not retrieve user information from OAuth provider")
        
        # Check if user exists by OAuth
        user = recommender.db.user.get_user_by_oauth(provider, oauth_id)
        
        if not user:
            # Check if email already exists (might be password account)
            existing_user = recommender.db.user.get_user_by_email(email)
            if existing_user:
                # Link OAuth to existing account
                # For now, we'll create a new account - in production, you might want to merge accounts
                raise HTTPException(
                    status_code=400, 
                    detail="An account with this email already exists. Please log in with your password first, then link OAuth."
                )
            
            # Create new user
            user = recommender.db.user.create_user(
                email=email,
                username=username,
                password_hash=None,
                oauth_provider=provider,
                oauth_id=oauth_id
            )
        
        # Create access token
        access_token = create_access_token(data={"sub": user['id'], "email": user['email']})
        
        # Redirect to frontend with token
        frontend_callback = f"{FRONTEND_URL}/auth/callback?token={access_token}&user_id={user['id']}"
        return RedirectResponse(url=frontend_callback)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in OAuth callback: {e}")
        error_url = f"{FRONTEND_URL}/auth/error?message={str(e)}"
        return RedirectResponse(url=error_url)


@router.get("/me", response_model=UserResponse, tags=["Auth"])
async def get_current_user(
    token: str = Depends(lambda: None),  # Will be extracted from Authorization header
    recommender: SpectraRecommender = Depends(get_recommender)
):
    """Get current authenticated user."""
    # This is a placeholder - in production, use proper dependency injection for token
    # For now, we'll handle this in the frontend
    pass

