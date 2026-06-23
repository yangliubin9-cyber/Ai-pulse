# ai-pulse backend

FastAPI backend for the ai-pulse AI news aggregator. Full project documentation is
maintained separately (see project `docs/`). This file is a minimal pointer required
by the package build; do not treat it as the delivery README.

Quick dev start:

```
python -m venv .venv && .venv/Scripts/activate   # Windows
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --port 17011
```

## 离线英文->中文翻译

采集的英文资讯在入库这一层被翻译成中文存到 `feed_items.title_zh` / `summary_zh`，
供前端直接显示中文（原 `title` / `summary` 英文原文保留，前端可切原文）。

- 引擎：`argostranslate`（基于 CTranslate2，本地、离线、无任何外部 API / key）。
- 配置：`TRANSLATION_ENABLED` / `TRANSLATION_PROVIDER`（默认 `local`）/ `TRANSLATION_TARGET_LANG`。
- 语言包：首次使用时自动下载并安装 `translate-en_zh` 包（幂等）；下载失败会抛清晰错误，不静默。
- 已是中文的标题/摘要会被 `is_probably_chinese()` 跳过，不重复翻译。

### 存量回填

把已入库但 `title_zh` / `summary_zh` 为空的英文行补翻译（幂等、可分批、可中断）：

```
python -m app.translate_backfill                  # 翻译所有缺中文的行
python -m app.translate_backfill --limit 50       # 只处理前 50 行
python -m app.translate_backfill --batch-size 25  # 每 25 行提交一次
```

### 私有化交付：语言包随镜像打包（离线）

生产 / 私有化环境通常无外网，应在构建镜像时把 en->zh 语言包预装进镜像，
运行时不再触发下载：

```
# Dockerfile 片段（构建期预下载并安装语言包）
RUN python -c "import argostranslate.package as p; \
    p.update_package_index(); \
    pkg=next(x for x in p.get_available_packages() if x.from_code=='en' and x.to_code=='zh'); \
    p.install_from_path(pkg.download())"
```

语言包默认装到 `~/.local/share/argos-translate/`（可用 `ARGOS_PACKAGES_DIR` 重定向）。
完全离线时：在有网机器上 `pkg.download()` 得到 `.argosmodel` 文件，随镜像 `COPY` 进去，
再 `argostranslate.package.install_from_path('/path/to/translate-en_zh.argosmodel')`。
