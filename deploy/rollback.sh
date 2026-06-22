#!/usr/bin/env bash
# ai-pulse compose 回滚（标准动作：只切回旧镜像，不动 DB——前提是 migration N-1 兼容）
# "恢复备份点"是仅限"升级当场失败、尚无新写入"的最后手段，会丢弃备份点之后的全部写入！
set -euo pipefail
TAG="${1:?用法: rollback.sh <目标镜像tag>}"
cd "$(dirname "$0")/.."

[ -f .env ] || { echo "ERROR: 未找到 .env（先从 .env.example 复制并填写）"; exit 1; }
set -a; source ./.env; set +a
: "${BACKEND_PORT:?ERROR: .env 缺少 BACKEND_PORT}"

echo "[1/3] 拉取目标镜像 ${TAG} 并切换"
IMAGE_TAG="$TAG" docker compose pull
IMAGE_TAG="$TAG" docker compose up -d

echo "[2/3] DB 处理：标准回滚不动 DB（N-1 兼容）。若本次升级被标注'不可回滚'，按"
echo "      docs/operations/upgrade-rollback.md 走前滚修复；恢复备份点仅限升级当场失败且无新写入"

echo "[3/3] 验证"
sleep 5
curl -fsS "http://localhost:${BACKEND_PORT}/healthz/ready" >/dev/null && echo "回滚完成 ✔" \
  || { echo "ERROR: readyz 未就绪，进入故障排查（docs/operations/troubleshooting.md）"; exit 1; }
