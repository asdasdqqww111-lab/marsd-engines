"""HUDHUD fix C-01 — isolated, per-request result storage for loki-verify.

Replaces the shared ``assets/response.json`` file which:
  * was overwritten by every new fact-check (last request wins),
  * mixed results between concurrent users (race on open/json.dump),
  * and made results unreachable after a server restart.

New contract (fully backward compatible with the existing template):
  * ``store_result(payload) -> str``      returns a unique verification ID.
  * ``load_result(result_id) -> dict``    returns the stored payload or ``None``.
  * ``delete_result(result_id)``          cleanup hook.
  * IDs are URL-safe (uuid4 hex) and never derived from user content.

Storage backend is chosen via ``HUDHUD_VERIFY_STORAGE``:
  * "sqlite"  (default) — a single dedicated database file
    (``HUDHUD_VERIFY_DB``, default: ``verification_results.sqlite``),
    safe for concurrent Flask workers via WAL mode.
  * "memory"  — ephemeral, for tests and local single-process use.

No user content is ever written inside the repository tree and no
secrets are stored. Old behavior (shared file) is NOT kept as a
fallback on purpose: silent cross-request leakage must be impossible.
"""

from __future__ import annotations

import json
import os
import sqlite3
import threading
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone

_STORAGE_MODE = os.environ.get("HUDHUD_VERIFY_STORAGE", "sqlite").strip().lower()
_DB_PATH = os.environ.get("HUDHUD_VERIFY_DB", "verification_results.sqlite")

# Memory backend (tests) — guarded by a lock for thread safety.
_memory_lock = threading.Lock()
_memory_store = {}

_TABLE_DDL = """
CREATE TABLE IF NOT EXISTS verification_result (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    payload_json TEXT NOT NULL
);
"""

MAX_AGE_DAYS = 30  # retention bound for the sqlite backend

_HEX_DIGITS = set("0123456789abcdef")


def _is_valid_result_id(result_id) -> bool:
    """Strict shape guard: 32-char lowercase hex only (uuid4().hex format)."""
    return (
        isinstance(result_id, str)
        and len(result_id) == 32
        and set(result_id.lower()) <= _HEX_DIGITS
    )


def new_result_id() -> str:
    """Generate a fresh, URL-safe, non-guessable verification ID."""
    return uuid.uuid4().hex


def store_result(payload: dict) -> str:
    """Persist one verification payload and return its unique ID."""
    result_id = new_result_id()
    created_at = datetime.now(timezone.utc).isoformat()
    body = json.dumps(payload, ensure_ascii=False)

    if _STORAGE_MODE == "memory":
        with _memory_lock:
            _memory_store[result_id] = {"created_at": created_at, "payload": payload}
        return result_id

    with _connect() as conn:
        conn.execute(
            "INSERT INTO verification_result (id, created_at, payload_json) VALUES (?, ?, ?)",
            (result_id, created_at, body),
        )
        _prune_expired(conn)
    return result_id


def load_result(result_id) -> dict | None:
    """Load one verification payload by ID. Returns ``None`` if missing/invalid."""
    if not _is_valid_result_id(result_id):
        return None

    if _STORAGE_MODE == "memory":
        with _memory_lock:
            entry = _memory_store.get(result_id)
        return entry["payload"] if entry else None

    with _connect() as conn:
        row = conn.execute(
            "SELECT payload_json FROM verification_result WHERE id = ?",
            (result_id,),
        ).fetchone()
    if row is None:
        return None
    try:
        return json.loads(row[0])
    except (TypeError, ValueError):
        return None


def delete_result(result_id) -> None:
    """Remove one stored result (cleanup hook; safe if missing)."""
    if not _is_valid_result_id(result_id):
        return

    if _STORAGE_MODE == "memory":
        with _memory_lock:
            _memory_store.pop(result_id, None)
        return

    with _connect() as conn:
        conn.execute("DELETE FROM verification_result WHERE id = ?", (result_id,))


def _prune_expired(conn) -> None:
    """Bound storage growth: drop results older than MAX_AGE_DAYS (best effort)."""
    try:
        cutoff_dt = datetime.now(timezone.utc) - timedelta(days=MAX_AGE_DAYS)
        conn.execute(
            "DELETE FROM verification_result WHERE created_at < ?",
            (cutoff_dt.isoformat(),),
        )
    except Exception:  # pragma: no cover — pruning must never break a request
        pass


@contextmanager
def _connect():
    conn = sqlite3.connect(_DB_PATH, timeout=30)
    try:
        conn.execute("PRAGMA journal_mode=WAL")  # safe concurrency
        conn.execute("PRAGMA busy_timeout=30000")
        conn.execute(_TABLE_DDL)
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()