import time
from collections import defaultdict
from threading import Lock
from typing import Callable
from fastapi import HTTPException, Request, status


class InMemoryRateLimiter:
    """
    Thread-safe sliding-window rate limiter for sensitive API routes (e.g., authentication).
    Uses client IP address and route name as the bucketing key.
    """

    def __init__(self, requests_limit: int = 30, time_window_seconds: int = 60):
        self.requests_limit = requests_limit
        self.time_window = time_window_seconds
        self.records = defaultdict(list)
        self.lock = Lock()

    def __call__(self, request: Request) -> None:
        client_ip = request.client.host if request.client else "127.0.0.1"
        # Combine IP with endpoint path to avoid throttling other operations
        key = f"{client_ip}:{request.url.path}"
        now = time.time()

        with self.lock:
            window_start = now - self.time_window
            valid_times = [t for t in self.records[key] if t > window_start]

            if len(valid_times) >= self.requests_limit:
                retry_after = max(1, int(self.time_window - (now - valid_times[0])))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many authentication attempts. Please wait before retrying.",
                    headers={"Retry-After": str(retry_after)},
                )

            valid_times.append(now)
            self.records[key] = valid_times


# Pre-configured rate limiters
auth_rate_limiter = InMemoryRateLimiter(requests_limit=30, time_window_seconds=60)
