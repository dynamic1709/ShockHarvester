"""Pydantic schemas for authentication endpoints."""
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "advisor"  # advisor | client
