"""Lightweight in-memory rate limiter (per client IP + scope).

Suitable for a single-process dev/demo deployment. For multi-instance production,
back this with Redis. Applied to sensitive endpoints (auth, upload) as a dependency.
"""
from __future__ import annotations

import threading
import time

from fastapi import HTTPException, Request, status

from app.core.config import settings


class RateLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def check(self, key: str, limit: int, window: float) -> bool:
        now = time.monotonic()
        cutoff = now - window
        with self._lock:
            q = self._hits.setdefault(key, [])
            while q and q[0] < cutoff:
                q.pop(0)
            if len(q) >= limit:
                return False
            q.append(now)
            return True

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


limiter = RateLimiter()


def rate_limit(limit: int, window: int, scope: str):
    """Dependency factory: allow `limit` requests per `window` seconds per IP."""

    def _dep(request: Request) -> None:
        if not settings.rate_limit_enabled:
            return
        client = request.client.host if request.client else "unknown"
        if not limiter.check(f"{scope}:{client}", limit, window):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please slow down and try again shortly.",
            )

    return _dep
