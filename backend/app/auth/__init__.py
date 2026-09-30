"""Auth package — JWT helpers and FastAPI dependency."""
from app.auth.jwt import create_access_token, decode_token
from app.auth.deps import get_current_user, require_advisor

__all__ = ["create_access_token", "decode_token", "get_current_user", "require_advisor"]
