# ai-pulse 本地开发一键入口（00-Global/local-development.md §2）
# 仅本地开发；交付用 docker-compose.yml / helm。
.PHONY: help setup dev-deps migrate seed dev-backend dev-frontend dev down

help:
	@echo "make setup        - 一键：起依赖 + 装前后端依赖 + migration + seed"
	@echo "make dev-deps     - 仅起本地依赖服务(postgres/redis)"
	@echo "make migrate      - 跑数据库 migration"
	@echo "make seed         - 灌演示种子数据(幂等)"
	@echo "make dev-backend  - 本地起后端(uvicorn --reload)"
	@echo "make dev-frontend - 本地起前端(vite)"
	@echo "make down         - 停本地依赖"

setup: dev-deps
	cp -n .env.dev.example .env || true
	cd backend && uv sync         # TODO(bootstrap): 按后端包管理器调整
	cd frontend && npm install    # TODO(bootstrap): 按前端包管理器调整
	$(MAKE) migrate
	$(MAKE) seed
	@echo "✔ setup 完成。make dev-backend / make dev-frontend 起服务"

dev-deps:
	docker compose -f docker-compose.dev.yml up -d

migrate:
	cd backend && uv run alembic upgrade head   # TODO(bootstrap): 按实际命令调整

seed:
	cd backend && uv run python -m app.scripts.seed   # TODO(bootstrap): 幂等 seed，演示数据默认 dev

dev-backend:
	cd backend && uv run uvicorn app.main:app --reload --port 17011

dev-frontend:
	cd frontend && npm run dev

down:
	docker compose -f docker-compose.dev.yml down
