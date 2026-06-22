# AI Pulse — 前端

克制、信息密度高的 AI 资讯聚合精选前端。React 18 + TypeScript(strict) + Vite 5 +
Tailwind + TanStack Query v5 + React Router v6（data router）。

## 本地开发

```bash
npm install          # 生成并保留 package-lock.json
npm run dev          # Vite，端口 17010，/api 代理到 http://localhost:17011
```

后端未启动时页面仍可渲染（卡片流进入错误态/空态）。

## 脚本

| 命令              | 说明                          |
|-------------------|-------------------------------|
| `npm run dev`     | 开发服务器（:17010）          |
| `npm run build`   | 类型检查 + 生产构建到 `dist/` |
| `npm run preview` | 预览生产构建                  |
| `npm run lint`    | ESLint                        |
| `npm test`        | Vitest 单测                   |

## 架构

- 依赖方向：`pages → components/hooks/api → lib`；`lib/` 不 import React。
- API 地址不硬编码：dev 走 Vite proxy（`/api → 17011`），生产同源；
  可用 `window.__APP_CONFIG__`（见 `public/config.example.js`）运行期覆盖。
- HTTP 封装在 `src/api/client.ts`：`fetch` + `credentials:'include'` +
  注入 `X-Request-Id` + 错误归一化（`{error:{code,message,request_id}}`）+
  统一 401（非 `/auth/` 请求收到 401 → 清 auth 缓存并跳 `/login`）。
- TanStack Query 的 queryKey 工厂集中在 `src/api/queryKeys.ts`。
- 主题：CSS 变量（HSL）定义在 `src/index.css` 的 `:root` 与 `[data-theme='dark']`；
  亮 / 暗 / 跟随系统三档（`themeStore` zustand persist + `prefers-color-scheme`
  监听 + `index.html` 内联防 FOUC 脚本）。

## 设计

石墨灰中性色 + 单一暖琥珀强调色，避开紫蓝渐变 / 玻璃拟态 / 统一大圆角重阴影卡片。
卡片流走"列表式时间轴"，信息密度高、文本优先，像真实资讯站。字体使用系统栈，
图标使用本地 `lucide-react`，无公网 CDN。

## 页面

- `/login` 登录（独立布局）
- `/` 精选（featured 时间轴 + 分类 chips + 分页）
- `/all` 全部（分类 + 来源筛选 + 分页）
- `/daily` AI 日报（按天聚合，可选日期）
- `/sources` 来源（只读清单 + 条数）
- `/settings` 设置（主题 / 改密 / 手动刷新 / 关于）

## 构建 / 部署

`Dockerfile` 多阶段：`node:20-alpine` 构建 → `nginx:alpine` 服务。nginx 模板
`nginx/nginx.conf.template` 通过 `envsubst` 注入 `${BACKEND_UPSTREAM}`
（默认 `http://backend:8000`）反代 `/api`，双栈 `listen [::]:80`，`/healthz`
返回 200，`index.html` no-cache、`/assets` 长缓存。健康检查用 busybox `wget` 探
`127.0.0.1/healthz`。

## 数据合规

仅展示公开来源（官方 RSS 博客、Hacker News、arXiv）提供的标题与摘要，保留原文
出处与链接，不转载第三方编辑的精选内容、不抓取站点数据。
