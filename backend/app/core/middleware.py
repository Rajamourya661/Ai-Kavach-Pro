"""
KAVACH AI Pro - Security Middleware
Sliding window rate limiting and security headers
"""

import time
import logging
import redis.asyncio as redis
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import secrets

logger = logging.getLogger(__name__)


class SecurityMiddleware(BaseHTTPMiddleware):
    """Adds security headers to all responses"""
    async def dispatch(self, request: Request, call_next):
        # Skip OPTIONS preflight — let CORSMiddleware handle it
        if request.method == "OPTIONS":
            return await call_next(request)

        # Generate request ID
        request_id = secrets.token_hex(8)
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-Request-ID"] = request_id
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Sliding window rate limiter backed by Redis sorted sets"""

    EXEMPT_PATHS = {"/health", "/ready", "/docs", "/openapi.json", "/redoc"}

    def __init__(self, app, redis_url: str, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.redis_url = redis_url
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._redis = None

    async def _get_redis(self):
        if self._redis is None:
            self._redis = redis.from_url(self.redis_url, decode_responses=True)
        return self._redis

    async def dispatch(self, request: Request, call_next):
        # Skip OPTIONS preflight — let CORSMiddleware handle it
        if request.method == "OPTIONS":
            return await call_next(request)

        # Skip rate limiting for health/docs endpoints
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        try:
            r = await self._get_redis()
            client_ip = request.client.host if request.client else "unknown"
            key = f"rl:{client_ip}"
            now = time.time()
            window_start = now - self.window_seconds

            pipe = r.pipeline()
            # Remove expired entries
            pipe.zremrangebyscore(key, 0, window_start)
            # Add current request
            pipe.zadd(key, {f"{now}:{secrets.token_hex(4)}": now})
            # Count requests in window
            pipe.zcard(key)
            # Set TTL
            pipe.expire(key, self.window_seconds + 1)
            results = await pipe.execute()

            request_count = results[2]

            if request_count > self.max_requests:
                retry_after = self.window_seconds
                raise HTTPException(
                    status_code=429,
                    detail={
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Rate limit exceeded. Try again in {retry_after}s.",
                        "retry_after": retry_after
                    }
                )

            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(self.max_requests)
            response.headers["X-RateLimit-Remaining"] = str(max(0, self.max_requests - request_count))
            response.headers["X-RateLimit-Reset"] = str(int(now + self.window_seconds))
            return response

        except HTTPException:
            raise
        except Exception as e:
            # If Redis is down, allow the request but log the error
            logger.warning(f"Rate limiter Redis error (allowing request): {e}")
            return await call_next(request)
