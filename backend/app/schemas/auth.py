"""Pydantic schemas for authentication endpoints."""
from datetime import datetime
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    client_id: str | None = None
    email: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "client"  # advisor | client


class UserProfileResponse(BaseModel):
    id: str
    email: str
    role: str
    client_id: str | None = None
    created_at: datetime | None = None
    last_login: datetime | None = None
