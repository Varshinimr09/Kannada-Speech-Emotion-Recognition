"""
Kannada Speech Emotion Recognition — Flask Backend
---------------------------------------------------
Run:  python app.py
      OR
      flask --app app run --debug
"""
from flask import Flask, jsonify
from flask_cors import CORS

import config
from database import init_db
from routes.auth    import auth_bp
from routes.predict import predict_bp
from routes.history import history_bp
from routes.stats   import stats_bp
from routes.visualization import viz_bp

app = Flask(__name__)

# CORS — allow any localhost / LAN port (dev) + configured production origin
# Build a list of common dev ports; flask_cors accepts a list but not a callable
_CORS_ORIGINS = [
    config.FRONTEND_ORIGIN,
    *(f"http://localhost:{p}" for p in range(3000, 3010)),
    *(f"http://127.0.0.1:{p}" for p in range(3000, 3010)),
    "http://localhost:5173", "http://localhost:5174",
]

CORS(app, resources={r"/api/*": {"origins": _CORS_ORIGINS}},
     supports_credentials=True)


# ── Register blueprints ──────────────────────────────────────────
app.register_blueprint(auth_bp)
app.register_blueprint(predict_bp)
app.register_blueprint(history_bp)
app.register_blueprint(stats_bp)
app.register_blueprint(viz_bp)


# ── Health check ─────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "Kannada SER Backend"}), 200


# ── Global error handlers ────────────────────────────────────────
@app.errorhandler(404)
def not_found(_e):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(405)
def method_not_allowed(_e):
    return jsonify({"error": "Method not allowed"}), 405


@app.errorhandler(500)
def internal_error(e):
    app.logger.exception("Unhandled exception")
    return jsonify({"error": "Internal server error"}), 500


# ── Startup ───────────────────────────────────────────────────────
def _warmup_models():
    """Pre-load both models in background threads so the first request is fast."""
    import threading

    def _load_ml():
        try:
            import ml.predictor  # triggers module-level _load_model() call
            print("[ML] Main model warmed up")
        except Exception as exc:
            print(f"[ML] Main model warm-up skipped: {exc}")

    def _load_comparison():
        try:
            from ml.openai_analyzer import _get_pipeline
            _get_pipeline()
            print("[ML] Comparison model warmed up")
        except Exception as exc:
            print(f"[ML] Comparison model warm-up skipped: {exc}")

    threading.Thread(target=_load_ml, daemon=True).start()
    threading.Thread(target=_load_comparison, daemon=True).start()


if __name__ == "__main__":
    init_db()
    _warmup_models()
    # use_reloader=False prevents WinError 10038 crash on Windows when files change
    app.run(host="0.0.0.0", port=config.PORT, debug=config.DEBUG, use_reloader=False)
