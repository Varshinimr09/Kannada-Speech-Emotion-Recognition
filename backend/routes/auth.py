from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
import bcrypt
from bson import ObjectId
from database import get_db
from auth_utils import create_token

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _serialize_user(doc: dict) -> dict:
    return {
        "id":    str(doc["_id"]),
        "name":  doc["name"],
        "email": doc["email"],
    }


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    name     = (data.get("name") or "").strip()
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"error": "name, email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    db = get_db()
    if db.users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    result  = db.users.insert_one({
        "name":       name,
        "email":      email,
        "password":   pw_hash,
        "created_at": datetime.now(timezone.utc),
    })

    user_id = str(result.inserted_id)
    token   = create_token(user_id)
    return jsonify({"token": token, "user": {"id": user_id, "name": name, "email": email}}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    db  = get_db()
    doc = db.users.find_one({"email": email})
    if not doc or not bcrypt.checkpw(password.encode(), doc["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_token(str(doc["_id"]))
    return jsonify({"token": token, "user": _serialize_user(doc)}), 200


@auth_bp.get("/me")
def me():
    from auth_utils import decode_token
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return jsonify({"error": "Unauthorized"}), 401
    user_id = decode_token(auth[7:])
    if not user_id:
        return jsonify({"error": "Token expired or invalid"}), 401

    db  = get_db()
    doc = db.users.find_one({"_id": ObjectId(user_id)})
    if not doc:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": _serialize_user(doc)}), 200
