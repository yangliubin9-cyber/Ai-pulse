"""Observability: X-Request-Id trace middleware + Prometheus metrics.

- RequestIdMiddleware: reads/sets X-Request-Id, binds trace_id into structlog
  contextvars, echoes the id back on the response.
- Prometheus default registry; /metrics endpoint serves the exposition format.
"""

from __future__ import annotations

import time
import uuid

import structlog
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

REQUEST_ID_HEADER = "X-Request-Id"

HTTP_REQUESTS = Counter(
    "aipulse_http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"],
)
HTTP_LATENCY = Histogram(
    "aipulse_http_request_duration_seconds",
    "HTTP request latency",
    ["method", "path"],
)
INGEST_RUNS = Counter(
    "aipulse_ingest_runs_total",
    "Total ingest runs",
    ["trigger"],
)
INGEST_ITEMS = Counter(
    "aipulse_ingest_items_total",
    "Total items ingested",
    ["result"],  # fetched | new
)


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        request_id = request.headers.get(REQUEST_ID_HEADER) or uuid.uuid4().hex
        request.state.request_id = request_id
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(trace_id=request_id)

        start = time.perf_counter()
        try:
            response = await call_next(request)
        finally:
            elapsed = time.perf_counter() - start
            route = request.scope.get("route")
            path = getattr(route, "path", request.url.path)
            HTTP_LATENCY.labels(request.method, path).observe(elapsed)

        status_code = response.status_code
        route = request.scope.get("route")
        path = getattr(route, "path", request.url.path)
        HTTP_REQUESTS.labels(request.method, path, str(status_code)).inc()
        response.headers[REQUEST_ID_HEADER] = request_id
        return response


def metrics_response() -> Response:
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
