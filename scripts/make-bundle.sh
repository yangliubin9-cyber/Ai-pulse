#!/usr/bin/env bash
###############################################################################
# ai-pulse 交付打包（行为契约：Project-Docs/04-Deployment/deploy-bundle.md §2）
#
# 用法：
#   bash scripts/make-bundle.sh v1.2.3                 # 在线模式
#   bash scripts/make-bundle.sh v1.2.3 --offline       # 离线模式（附镜像 tar）
#   bash scripts/make-bundle.sh v1.2.3 --verify-only   # CI 防漂移校验（bundle:verify，逐文件 diff）
#
# 拷入项目后按 vendoring 双重追踪登记（source: Project-Docs/99-Templates/bootstrap-scaffold/scripts/make-bundle.sh）
###############################################################################
set -euo pipefail

PROJECT="ai-pulse"
TAG="${1:?用法: make-bundle.sh <git-tag> [--offline|--verify-only]}"
MODE="${2:-online}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUNDLE="$ROOT/deploy-bundle/${PROJECT}-${TAG}"

# ── 前置校验（CI/打包机上没有 .env，统一用 .env.example 注入；任一失败即退出非零） ──
[ -z "$(git -C "$ROOT" status --porcelain)" ] || { echo "ERROR: 工作区不干净"; exit 1; }
git -C "$ROOT" rev-parse "refs/tags/${TAG}" >/dev/null 2>&1 || { echo "ERROR: tag ${TAG} 不存在"; exit 1; }
IMAGE_TAG="${TAG#v}" docker compose -f "$ROOT/docker-compose.yml" --env-file "$ROOT/.env.example" config -q \
  || { echo "ERROR: compose config 失败"; exit 1; }
helm lint "$ROOT/helm" >/dev/null || { echo "ERROR: helm lint 失败"; exit 1; }
helm template "$ROOT/helm" --set image.tag="${TAG#v}" >/dev/null || { echo "ERROR: helm template 失败"; exit 1; }

# ── 生成（--verify-only 时生成到临时目录，不污染正式产物） ──
DEST="$BUNDLE"
[ "$MODE" = "--verify-only" ] && DEST="$(mktemp -d)/${PROJECT}-${TAG}"
rm -rf "$DEST"; mkdir -p "$DEST/compose" "$DEST/helm"
cp "$ROOT/docker-compose.yml" "$DEST/compose/"
[ -f "$ROOT/docker-compose.prod.yml" ] && cp "$ROOT/docker-compose.prod.yml" "$DEST/compose/"
cp "$ROOT/.env.example" "$DEST/compose/"
cp -r "$ROOT/deploy" "$DEST/compose/deploy"
cp -r "$ROOT/helm/." "$DEST/helm/"

# ── 防漂移校验（deploy-bundle.md §3：与项目根交付物逐文件 diff，不一致即 fail） ──
if [ "$MODE" = "--verify-only" ]; then
  fail=0
  diff -r "$DEST/compose/deploy" "$ROOT/deploy" || fail=1
  diff "$DEST/compose/docker-compose.yml" "$ROOT/docker-compose.yml" || fail=1
  diff "$DEST/compose/.env.example" "$ROOT/.env.example" || fail=1
  diff -r "$DEST/helm" "$ROOT/helm" || fail=1
  rm -rf "$(dirname "$DEST")"
  [ "$fail" -eq 0 ] && { echo "bundle:verify 通过（交付物与打包产物一致）"; exit 0; } \
                    || { echo "ERROR: bundle:verify 发现漂移"; exit 1; }
fi

# ── 离线模式：导出镜像 + 生成导入/推送脚本 ────────────────
if [ "$MODE" = "--offline" ]; then
  mkdir -p "$DEST/images"
  IMAGES=$(IMAGE_TAG="${TAG#v}" docker compose -f "$ROOT/docker-compose.yml" --env-file "$ROOT/.env.example" config --images | sort -u)
  : > "$DEST/images/manifest.txt"
  for img in $IMAGES; do
    docker pull "$img"
    digest=$(docker inspect --format='{{index .RepoDigests 0}}' "$img" 2>/dev/null || echo "$img")
    echo "$digest" >> "$DEST/images/manifest.txt"
    docker save "$img" -o "$DEST/images/$(echo "$img" | tr '/:' '__').tar"
  done
  cat > "$DEST/images/load-images.sh" <<'EOF'
#!/usr/bin/env bash
# compose 单机路径：批量导入镜像
set -euo pipefail
cd "$(dirname "$0")"
for t in *.tar; do docker load -i "$t"; done
echo "导入完成；核对 manifest.txt 中的 digest"
EOF
  cat > "$DEST/images/push-images.sh" <<'EOF'
#!/usr/bin/env bash
# helm 集群路径：load 后统一 tag 并 push 到客户 registry（之后把 values 的 image.registry 指向它）
set -euo pipefail
REG="${1:?用法: push-images.sh <客户registry，如 registry.customer.local>}"
cd "$(dirname "$0")"
for t in *.tar; do docker load -i "$t"; done
while read -r img; do
  name="${img%%@*}"
  new="$REG/${name#*/}"
  docker tag "$name" "$new" && docker push "$new"
done < manifest.txt
echo "推送完成；请确认集群节点能从 $REG 拉取镜像后再执行 helm install"
EOF
fi

# ── 生成 INSTALL.md / VERSION / SHA256SUMS（无生成时间，保证同 tag 重跑结果一致） ──
COMMIT=$(git -C "$ROOT" rev-parse "$TAG")
printf "version: %s\ncommit: %s\nmode: %s\n" "$TAG" "$COMMIT" "${MODE#--}" > "$DEST/VERSION"
echo "TODO(bootstrap): 按 deploy-bundle.md §4 七项内容生成 INSTALL.md（前置要求/校验/镜像导入/二选一部署/healthz 验证/排查/运维入口）" > "$DEST/INSTALL.md"
( cd "$DEST" && find . -type f ! -name SHA256SUMS -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > SHA256SUMS )
echo "完成: $DEST"
