#!/usr/bin/env bash
# ai-pulse compose 升级（标准 5 步，04-Deployment/docker-compose.md）
# 回滚策略前提：migration 必须 N-1 兼容（expand-contract），回滚只切镜像不动 DB
set -euo pipefail
TAG="${1:?用法: upgrade.sh <新镜像tag>}"
cd "$(dirname "$0")/.."

[ -f .env ] || { echo "ERROR: 未找到 .env（先从 .env.example 复制并填写）"; exit 1; }
set -a; source ./.env; set +a
: "${BACKEND_PORT:?ERROR: .env 缺少 BACKEND_PORT}"

echo "[1/5] 强制备份（失败即中止升级）"
bash deploy/backup.sh

echo "[2/5] 拉取新镜像 ${TAG}"
IMAGE_TAG="$TAG" docker compose pull

echo "[3/5] 执行 migration（必须 N-1 兼容；不可逆 migration 需停写窗口，见 upgrade-rollback 手册）"
IMAGE_TAG="$TAG" docker compose run --rm backend echo "TODO(bootstrap): alembic upgrade head"

echo "[4/5] 滚动启动"
IMAGE_TAG="$TAG" docker compose up -d

echo "[5/5] 烟雾测试"
sleep 5
curl -fsS "http://localhost:${BACKEND_PORT}/healthz/ready" >/dev/null && echo "升级完成 ✔" \
  || { echo "ERROR: readyz 未就绪，按 deploy/rollback.sh 回滚"; exit 1; }
