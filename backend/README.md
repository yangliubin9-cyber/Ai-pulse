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
