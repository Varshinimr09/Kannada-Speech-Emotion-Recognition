from flask import Blueprint, request, jsonify
from bson import ObjectId
from database import get_db
from auth_utils import require_auth

history_bp = Blueprint("history", __name__, url_prefix="/api/predictions")


def _serialize(doc: dict) -> dict:
    return {
        "id":                str(doc["_id"]),
        "audioFile":         doc.get("audio_file", ""),
        "cloudinaryUrl":     doc.get("cloudinary_url", ""),
        "emotion":           doc.get("emotion", ""),
        "confidence":        doc.get("confidence", 0),
        "probabilities":     doc.get("probabilities", []),
        "acoustic_features": doc.get("acoustic_features", {}),
        "duration":          doc.get("duration", ""),
        "source":            doc.get("source", "upload"),
        "timestamp":         doc["timestamp"].isoformat() if doc.get("timestamp") else "",
    }


@history_bp.get("")
@require_auth
def get_history(current_user_id: str):
    limit  = min(int(request.args.get("limit", 50)), 200)
    offset = int(request.args.get("offset", 0))

    db   = get_db()
    docs = (
        db.predictions
        .find({"user_id": current_user_id})
        .sort("timestamp", -1)
        .skip(offset)
        .limit(limit)
    )
    total = db.predictions.count_documents({"user_id": current_user_id})
    return jsonify({
        "predictions": [_serialize(d) for d in docs],
        "total":  total,
        "limit":  limit,
        "offset": offset,
    }), 200


@history_bp.delete("")
@require_auth
def clear_history(current_user_id: str):
    db     = get_db()
    result = db.predictions.delete_many({"user_id": current_user_id})
    return jsonify({"deleted": result.deleted_count}), 200


@history_bp.delete("/<prediction_id>")
@require_auth
def delete_one(prediction_id: str, current_user_id: str):
    try:
        oid = ObjectId(prediction_id)
    except Exception:
        return jsonify({"error": "Invalid prediction id"}), 400

    db     = get_db()
    result = db.predictions.delete_one({"_id": oid, "user_id": current_user_id})
    if result.deleted_count == 0:
        return jsonify({"error": "Prediction not found or not owned by you"}), 404
    return jsonify({"deleted": 1}), 200
