# AI Pulse

> 个人私有的 **AI 资讯聚合精选** 站 —— 每天从公开来源聚合 AI 圈动态，离线翻译成中文，按模型 / 产品 / 行业 / 论文 / 技巧分类，站内时间轴卡片流阅读。

把散落在各处的 AI 英文资讯，收敛成一条清晰的中文时间线。数据全部来自公开 API / RSS 自行合法采集，自动持续更新，私有自用。

---

## 功能特性

- **多源聚合**：RSS 官方博客（OpenAI / Google DeepMind / Hugging Face / Google AI / MIT News - AI / BAIR / MarkTechPost 等）+ Hacker News 官方 API + arXiv 官方 API
- **离线中文翻译**：入库时把英文标题 / 摘要 / 正文用本地离线引擎（argostranslate，无需任何外部 API / Key）翻成中文；术语保护（AI / GitHub / 模型名等专名不乱翻）+ 中英排版规整
- **站内阅读**：点卡片在站内读中文正文（源提供全文则展示全文，否则中文摘要 + 原文链接），保留原文出处
- **分类与检索**：模型 / 产品 / 行业 / 论文 / 技巧 五类关键词打标；分类筛选 + 关键词搜索（中英文均可）+ 分页
- **AI 日报**：按天聚合、按分类分组、带统计与日期选择
- **时间轴卡片流**：来源头像 + @作者 + 热度徽章 + 中文标题/摘要，深色为主，亮 / 暗 / 跟随系统三档主题
- **国际化**：界面中 / 英双语切换（默认中文）
- **登录鉴权**：Session Cookie（密码 scrypt 哈希，会话存 Redis），个人单用户
- **私有化**：全离线（翻译模型打入镜像），`docker compose` 一键起，`restart: unless-stopped` 开机自启

> ⚖️ **合规边界**：仅聚合各来源通过公开 RSS / API 主动下发的内容（标题 / 摘要 / 全文字段 / arXiv 摘要），保留原文链接与出处；不抓取第三方文章网页正文、不复制第三方站点的编辑/精选数据。

---

## 技术栈

| 层 | 选型 |
|----|------|
| 前端 | React 18 + TypeScript（strict）+ Vite 5 + Tailwind CSS + TanStack Query v5 + React Router v6 |
| 后端 | Python 3.12 + FastAPI + SQLAlchemy 2（async）+ Alembic + pydantic-settings |
| 采集 | feedparser（RSS）+ httpx（HN / arXiv 官方 API），定时后台循环 + 手动触发 |
| 翻译 | argostranslate（本地离线 en→zh，CTranslate2）+ 术语表保护 + 排版规整 |
| 数据 | PostgreSQL（资讯/用户）、Redis（会话/缓存）、本地对象存储（local-filesystem） |
| 部署 | docker-compose / GitLab CI / Helm 三套交付物 |

---

## 目录结构

```
ai-pulse/
├── frontend/                 前端（React + TS；页面 pages/、组件 components/、i18n/）
├── backend/                  后端（FastAPI）
│   └── app/
│       ├── api/v1/           路由（items / meta / auth / ingest / healthz）
│       ├── usecases/         业务编排（ingest / feed / auth）
│       ├── collectors/       采集器（rss / hackernews / arxiv）
│       ├── services/         统一接口层（database / cache / object_storage / translation）
│       ├── repositories/     数据访问
│       ├── models/ schemas/  ORM 模型 / 入出参
│       └── core/             config / logging / security / errors / observability
├── services/                 各 Service 分类的部署配置（非业务代码）
├── docs/                     api / operations / customer / architecture 文档
├── deploy/                   升级 / 回滚 / 备份脚本
├── docker-compose.yml + helm/ + .gitlab-ci.yml   三种交付物
└── .agent.md / .env.example / VENDOR.md
```

---

## 快速开始

### 一键运行（Docker，推荐）

```bash
cp .env.example .env          # 按需修改密码等（已带本机可用默认值时可直接用）
docker compose up -d --wait   # 起 前端 / 后端 / postgres / redis
docker compose exec backend python -m alembic upgrade head   # 建表（首次）
```

- 前端： http://localhost:17010
- 后端 API / 文档： http://localhost:17011/docs
- 默认账号：`admin@ai-pulse.local` / `changeme-admin-2026`（**首次登录后请在「设置」改密**）

资讯会在启动后自动采集一轮（`INGEST_ON_STARTUP=true`），之后每 `INGEST_INTERVAL_MINUTES` 分钟增量采集并自动翻译。也可登录后 `POST /api/v1/ingest/run` 手动触发。

### 本地开发

```bash
# 依赖服务（postgres 17012 / redis 17013）
docker compose -f docker-compose.dev.yml up -d
# 后端
cd backend && python -m venv .venv && .venv/bin/pip install -e ".[dev]" && .venv/bin/uvicorn app.main:app --reload --port 17011
# 前端
cd frontend && npm install && npm run dev      # http://localhost:17010 ，/api 代理到 17011
```

---

## 配置

所有配置走环境变量，样例见 [`.env.example`](.env.example)（每字段含注释）。关键项：

| 变量 | 说明 |
|------|------|
| `DATABASE_PROVIDER` / `DB_*` | 数据库（默认 postgres） |
| `CACHE_PROVIDER` / `CACHE_*` | 缓存（默认 redis，存会话） |
| `OBJECT_STORAGE_PROVIDER` / `OBJECT_STORAGE_*` | 对象存储（默认 local-filesystem） |
| `TRANSLATION_ENABLED` / `TRANSLATION_PROVIDER` | 离线翻译开关（默认开 / local） |
| `INGEST_WINDOW_DAYS` / `INGEST_INTERVAL_MINUTES` / `INGEST_ON_STARTUP` | 采集窗口 / 周期 / 启动即采 |
| `APP_SECRET_KEY` / `SESSION_COOKIE_SECURE` / `CORS_ORIGINS` | 应用密钥 / Cookie 安全 / 跨域 |

端口段：**17010–17019**（前端 17010 / 后端 17011 / postgres 17012 / redis 17013）。

---

## 主要 API

前缀 `/api/v1`，除 `/auth/login` 外均需登录（Session Cookie）。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/items?category=&source_type=&q=&featured=&page=&page_size=` | 资讯列表 |
| GET | `/items/{id}` | 资讯详情（含中文正文 content_zh） |
| GET | `/categories` / `/sources` / `/stats` / `/daily` | 分类计数 / 来源 / 统计 / 日报 |
| POST | `/ingest/run` | 手动触发采集 + 异步翻译 |
| POST | `/auth/login` `/auth/logout`，GET `/auth/me`，POST `/auth/change-password` | 鉴权 |
| GET | `/healthz/{live,ready,startup}` `/metrics` | 探针 / 指标（不鉴权） |

---

## 部署交付

支持三种私有化交付（字段名一一对应）：

- **docker-compose**：`docker-compose.yml` + `.env`
- **Helm**：`helm/`（Chart + values）
- **GitLab CI**：`.gitlab-ci.yml`

翻译模型已打入后端镜像，支持离线 / 内网部署。

---

## 路线图

- [ ] 接入 LLM 供应商（用户自带 Key）：把翻译质量从离线机翻升级为通顺译文，并生成「精选评分 + 推荐理由」
- [ ] 补齐铁律二其余 provider（database / object-storage 等）
- [ ] helm / CI 补齐集、`uv.lock`、文档定稿

---

## 许可

私有项目，保留所有权利。资讯内容版权归各原始来源所有，本站仅作个人聚合阅读并保留原文出处与链接。
