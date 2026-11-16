from flask import Blueprint, jsonify
import datetime
import sys

# HUDHUD health contract — loki-verify (HUDHUD Verify).
# Registered unconditionally in webapp.py so the app always serves it.
#
# HUDHUD fix M-03: this contract is now HONEST about readiness:
#   * "status" is liveness (process is up) — always reported.
#   * "readiness" tells the caller whether the fact-check pipeline can
#     actually serve requests right now (pipeline initialized + provider
#     config present). Absence of readiness is reported as false — never
#     faked as healthy.
#   * No secrets or provider key values are ever exposed — presence only.
#
# Mapping to HUDHUD portal states:
#   status=ok + readiness=ready     -> HEALTHY
#   status=ok + readiness=degraded  -> DEGRADED (pipeline up, providers missing)
#   status=down                     -> UNAVAILABLE

health_bp = Blueprint("hudhud_health", __name__)


def _pipeline_ready() -> bool:
    """True only if a FactCheck instance is actually initialized in webapp."""
    webapp = sys.modules.get("webapp")
    return getattr(webapp, "factcheck_instance", None) is not None


def _provider_config_present() -> bool:
    """Presence-only check: does the configured api_config hold any provider value?
    Values are never returned — only their non-empty presence is reported."""
    try:
        import os
        cfg_path = os.environ.get(
            "HUDHUD_VERIFY_API_CONFIG", "factcheck/config/api_config.yaml"
        )
        if not os.path.exists(cfg_path):
            return False
        from factcheck.utils.utils import load_yaml
        cfg = load_yaml(cfg_path) or {}
        if not isinstance(cfg, dict):
            return False
        # A configured provider = at least one non-empty value in the config map.
        return any(
            isinstance(v, str) and v.strip() != ""
            for v in cfg.values()
        )
    except Exception:
        return False


@health_bp.route("/api/health", methods=["GET"])
def health():
    pipeline_ready = _pipeline_ready()
    provider_present = _provider_config_present()

    if pipeline_ready and provider_present:
        level = "ready"
    elif pipeline_ready:
        level = "degraded"
    else:
        level = "not_ready"

    return jsonify(
        {
            "status": "ok",
            "techId": "loki-verify",
            "app": "HUDHUD Verify",
            "readiness": {
                "pipeline_initialized": pipeline_ready,
                "provider_config_present": provider_present,
                "level": level,
            },
            "detail": (
                "liveness ok; pipeline ready"
                if level == "ready"
                else "liveness ok; pipeline not ready — init missing or provider config absent"
            ),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
    )