# JWT authentication utilities for FastAPI. Provides password hashing, token creation, and user extraction.
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Secret key for JWT encoding/decoding (change in production!)
SECRET_KEY = "your_secret_key_here"
# JWT algorithm
ALGORITHM = "HS256"
# Token expiration time in minutes
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a plain password for storage."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

# JWT creation
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token with optional expiration."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# JWT decoding
def decode_access_token(token: str):
    """Decode a JWT access token and return the payload, or None if invalid."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

# OAuth2 scheme for extracting token from requests
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="farmer_login") 

def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependency to extract and validate the current user from the JWT token."""
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload