"""Auth package — JWT helpers and FastAPI dependencies."""
from app.auth.jwt import create_access_token, decode_token, verify_password, get_password_hash
from app.auth.deps import get_current_user, require_advisor, require_client_self

__all__ = [
    "create_access_token",
    "decode_token",
    "verify_password",
    "get_password_hash",
    "get_current_user",
    "require_advisor",
    "require_client_self",
]
