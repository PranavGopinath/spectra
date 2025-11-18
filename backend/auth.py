"""Authentication utilities for password hashing and JWT tokens."""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def _truncate_password_bytes(password: str, max_bytes: int = 72) -> bytes:
    """Truncate password to max_bytes, ensuring valid UTF-8."""
    password_bytes = password.encode('utf-8')
    if len(password_bytes) <= max_bytes:
        return password_bytes
    
    # Truncate to max_bytes
    truncated_bytes = password_bytes[:max_bytes]
    
    # Remove any incomplete UTF-8 sequences at the end
    # Continuation bytes start with 10xxxxxx (0x80-0xBF)
    # We need to find the last valid UTF-8 character boundary
    while truncated_bytes and (truncated_bytes[-1] & 0xC0) == 0x80:
        truncated_bytes = truncated_bytes[:-1]
    
    return truncated_bytes


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    # Bcrypt has a 72-byte limit, truncate if necessary
    truncated_bytes = _truncate_password_bytes(plain_password, max_bytes=72)
    truncated_password = truncated_bytes.decode('utf-8', errors='ignore')
    return pwd_context.verify(truncated_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    # Bcrypt has a 72-byte limit, truncate if necessary
    # Convert to bytes first to check actual byte length
    password_bytes = password.encode('utf-8')
    
    # Truncate to 72 bytes if needed
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
        # Remove any incomplete UTF-8 sequences at the end
        while password_bytes and (password_bytes[-1] & 0xC0) == 0x80:
            password_bytes = password_bytes[:-1]
    
    # Decode back to string for passlib
    truncated_password = password_bytes.decode('utf-8', errors='ignore')
    
    # Final safety check - ensure it's definitely <= 72 bytes
    final_bytes = truncated_password.encode('utf-8')
    if len(final_bytes) > 72:
        # This shouldn't happen, but if it does, force truncate
        final_bytes = final_bytes[:72]
        while final_bytes and (final_bytes[-1] & 0xC0) == 0x80:
            final_bytes = final_bytes[:-1]
        truncated_password = final_bytes.decode('utf-8', errors='ignore')
    
    return pwd_context.hash(truncated_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

