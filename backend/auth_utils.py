import functools
import jwt
from datetime import datetime, timezone
from flask import request, jsonify
import config


def create_token(user_id: str) -> str:
    from datetime import timedelta
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=config.JWT_EXPIRY_DAYS),
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def require_auth(f):
    """Decorator — injects current_user_id into the route function."""
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        token = auth_header[7:]
        user_id = decode_token(token)
        if user_id is None:
            return jsonify({"error": "Token expired or invalid"}), 401
        return f(*args, current_user_id=user_id, **kwargs)
    return wrapper
