"""
KAVACH AI Pro - Authentication Endpoints
Registration, login, token refresh, profile management
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.database import User, UserRole
from app.core.auth import (
    create_access_token, create_refresh_token, decode_token, get_current_user
)
from app.core.config import settings
from app.utils.security import EncryptionUtils, AuditLogger
from app.schemas.auth import (
    UserRegisterRequest, UserLoginRequest, TokenResponse,
    RefreshTokenRequest, UserResponse, MessageResponse
)

router = APIRouter()


@router.post("/register", response_model=MessageResponse, status_code=201)
async def register(
    request: Request,
    data: UserRegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user account"""
    # Check existing email
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail={"code": "EMAIL_EXISTS", "message": "Email already registered"}
        )

    # Check existing username
    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail={"code": "USERNAME_EXISTS", "message": "Username already taken"}
        )

    # Create user
    user = User(
        email=data.email,
        username=data.username,
        hashed_password=EncryptionUtils.hash_password(data.password),
        full_name=data.full_name,
        role=UserRole.USER,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    # Audit log
    await AuditLogger.log_action(
        user_id=user.id,
        action="user.register",
        resource_type="user",
        resource_id=user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return MessageResponse(message="Account created successfully. Please login.")


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    data: UserLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate and receive JWT tokens"""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not EncryptionUtils.verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail={"code": "ACCOUNT_DISABLED", "message": "Account has been disabled"}
        )

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    await db.flush()

    # Generate tokens
    token_data = {"sub": user.id, "email": user.email, "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Audit log
    await AuditLogger.log_action(
        user_id=user.id,
        action="user.login",
        resource_type="user",
        resource_id=user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    payload = decode_token(data.refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=401,
            detail={"code": "INVALID_TOKEN", "message": "Invalid or expired refresh token"}
        )

    token_data = {"sub": payload["sub"], "email": payload["email"], "role": payload["role"]}
    new_access = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.get("/me", response_model=UserResponse)
async def get_profile(user: User = Depends(get_current_user)):
    """Get current user profile"""
    return user
