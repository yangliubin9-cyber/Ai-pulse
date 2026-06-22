#!/bin/sh
# Render nginx config with runtime env vars before nginx starts.
# nginx:alpine's own entrypoint already runs templates via envsubst, but we keep
# this explicit script so BACKEND_UPSTREAM is guaranteed substituted.
set -e

: "${BACKEND_UPSTREAM:=http://backend:8000}"
export BACKEND_UPSTREAM

envsubst '${BACKEND_UPSTREAM}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

echo "[entrypoint] BACKEND_UPSTREAM=${BACKEND_UPSTREAM}"
