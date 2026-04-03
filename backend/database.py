from pymongo import MongoClient, ASCENDING
from pymongo.errors import ConnectionFailure
import config

_client: MongoClient | None = None


def get_db():
    global _client
    if _client is None:
        _client = MongoClient(config.MONGO_URI, serverSelectionTimeoutMS=5000)
    return _client[config.MONGO_DB]


def init_db():
    """Create indexes on first startup."""
    try:
        db = get_db()
        db.users.create_index([("email", ASCENDING)], unique=True)
        db.predictions.create_index([("user_id", ASCENDING)])
        db.predictions.create_index([("timestamp", ASCENDING)])
        print("[DB] MongoDB connected and indexes ensured.")
    except ConnectionFailure as e:
        print(f"[DB] WARNING: Could not connect to MongoDB — {e}")
