#!/usr/bin/env bash
# ai-pulse 备份（升级前强制执行；恢复步骤见 docs/operations/backup-restore.md）
# 任一步失败即 exit 非零——绝不打印"备份完成"的假成功
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] || { echo "ERROR: 未找到 .env（先从 .env.example 复制并填写）"; exit 1; }
set -a; source ./.env; set +a

TS="$(date -u +%Y%m%d_%H%M%S)"
OUT="backups/${TS}"
mkdir -p "$OUT"

echo "[1/4] 备份数据库（pg_dump + 完整性校验）"
docker compose exec -T postgres pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "$OUT/db.sql.gz"
gzip -t "$OUT/db.sql.gz"
[ "$(stat -c%s "$OUT/db.sql.gz")" -gt 200 ] || { echo "ERROR: dump 异常小，疑似失败"; exit 1; }
gunzip -c "$OUT/db.sql.gz" | tail -n 5 | grep -q "PostgreSQL database dump complete" \
  || { echo "ERROR: dump 结尾标记缺失（截断？）"; exit 1; }

echo "[2/4] 备份 redis（BGSAVE 等待落盘后拷出 RDB）"
LAST=$(docker compose exec -T redis redis-cli -a "${CACHE_PASSWORD}" --no-auth-warning LASTSAVE | tr -d '\r')
docker compose exec -T redis redis-cli -a "${CACHE_PASSWORD}" --no-auth-warning BGSAVE >/dev/null
for i in $(seq 1 60); do
  NOW=$(docker compose exec -T redis redis-cli -a "${CACHE_PASSWORD}" --no-auth-warning LASTSAVE | tr -d '\r')
  [ "$NOW" != "$LAST" ] && break
  sleep 1
  [ "$i" -eq 60 ] && { echo "ERROR: BGSAVE 60s 未完成"; exit 1; }
done
docker compose cp redis:/data/dump.rdb "$OUT/redis-dump.rdb"
[ -s "$OUT/redis-dump.rdb" ] || { echo "ERROR: RDB 文件为空"; exit 1; }

echo "[3/4] 备份生效配置（脱敏）"
grep -v -E "(PASSWORD|SECRET|TOKEN|KEY)=" .env > "$OUT/env.masked" || true
echo "TODO(bootstrap): 其他启用分类（对象存储 / 向量库）的备份在此追加"

echo "[4/4] 生成校验和"
( cd "$OUT" && sha256sum * > SHA256SUMS )

echo "备份完成并通过校验: $OUT ✔"
