# syntax=docker/dockerfile:1
# ai-pulse backend -- multi-stage, non-root (uid 10001).

# ---------- builder ----------
FROM python:3.12-slim AS builder
ENV PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /app
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
# Dependency layer: install from pyproject only (cache-friendly).
# README.md must be copied too: pyproject declares `readme = "README.md"`,
# pip reads it during metadata generation or the build fails.
COPY pyproject.toml README.md ./
COPY app/__init__.py ./app/__init__.py
RUN pip install --upgrade pip && pip install ".[providers]"

# ---------- runtime ----------
FROM python:3.12-slim AS runtime
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH" \
    OBJECT_STORAGE_LOCAL_PATH=/data/storage \
    ARGOS_PACKAGES_DIR=/opt/argos-packages
WORKDIR /app

# Non-root user
RUN groupadd -g 10001 appuser \
 && useradd -m -u 10001 -g 10001 appuser \
 && mkdir -p /data/storage /app/data/storage \
 && chown -R 10001:10001 /data /app

COPY --from=builder /opt/venv /opt/venv

# Bake the offline en->zh translation model into the image so no download happens
# at runtime (required for air-gapped private delivery). Stored under
# ARGOS_PACKAGES_DIR and owned by the non-root runtime user.
RUN mkdir -p /opt/argos-packages \
 && python -c "import argostranslate.package as p; p.update_package_index(); pk=next(x for x in p.get_available_packages() if x.from_code=='en' and x.to_code=='zh'); p.install_from_path(pk.download())" \
 && chown -R 10001:10001 /opt/argos-packages
# App code last (changes most often) -- no reinstall.
COPY --chown=10001:10001 . /app

USER 10001:10001
# 容器内监听端口由 BACKEND_PORT 决定（compose 设为 8000，与前端 nginx 默认 upstream backend:8000 一致）
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["sh", "-c", "python -c \"import os,urllib.request,sys; p=os.environ.get('BACKEND_PORT','8000'); sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:'+p+'/healthz/live',timeout=3).status==200 else 1)\""]

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${BACKEND_PORT:-8000}"]
