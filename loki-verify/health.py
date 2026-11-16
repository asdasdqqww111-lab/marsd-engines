from flask import Blueprint, jsonify
import datetime

# HUDHUD health contract — loki-verify (HUDHUD Verify).
# Liveness only: no DB, no LLM client, no secrets.
# Registered unconditionally in webapp.py so the app always serves it.

health_bp = Blueprint("hudhud_health", __name__)


@health_bp.route("/api/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "ok",
            "techId": "loki-verify",
            "app": "HUDHUD Verify",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
    )
