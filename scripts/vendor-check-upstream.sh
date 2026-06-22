#!/usr/bin/env bash
# vendor 上游定期检查骨架（铁律一；细则 00-Global/vendoring.md §6）
# 无 vendored 文件时本脚本直接通过；有 vendored 文件后按 VENDOR.md 清单逐条实现检查
set -euo pipefail
cd "$(dirname "$0")/.."

if ! grep -qE '^\| ' VENDOR.md 2>/dev/null; then
  echo "VENDOR.md 无条目，跳过上游检查"
  exit 0
fi
echo "TODO(bootstrap): 按 VENDOR.md 的 Source URL + Sync Policy 逐条检查上游更新（vendoring.md §6）"
exit 0
