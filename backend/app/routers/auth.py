"""Auth router — login, register, logout, and current-user endpoints."""
from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.auth.jwt import create_access_token, get_password_hash, verify_password
from app.database import get_db
from app.models.user import User
from app.models.portfolio import Client
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserProfileResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user and return a JWT token."""
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    if body.role not in ("advisor", "client"):
        raise HTTPException(status_code=400, detail="role must be 'advisor' or 'client'")

    client_id = None
    if body.role == "client":
        client = Client(
            name=body.email.split("@")[0].capitalize(),
            email=body.email,
            risk_profile="moderate",
            cash=100000.0,
        )
        db.add(client)
        await db.flush()
        client_id = client.id

    user = User(
        email=body.email,
        password_hash=get_password_hash(body.password),
        role=body.role,
        client_id=client_id,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token(
        user_id=user.id,
        role=user.role,
        client_id=user.client_id,
    )
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=str(user.id),
        client_id=str(user.client_id) if user.client_id else None,
        email=user.email,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT token."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    await db.flush()

    token = create_access_token(
        user_id=user.id,
        role=user.role,
        client_id=user.client_id,
    )
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=str(user.id),
        client_id=str(user.client_id) if user.client_id else None,
        email=user.email,
    )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Log out current user session."""
    return {"message": "Logged out successfully", "user_id": str(current_user.id)}


@router.get("/me", response_model=UserProfileResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return UserProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        role=current_user.role,
        client_id=str(current_user.client_id) if current_user.client_id else None,
        created_at=current_user.created_at,
        last_login=current_user.last_login,
    )
