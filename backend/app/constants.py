"""Project-wide constants: categories, collection sources, keyword rules.

v1 keeps collection-source config as code constants (no DB table per .agent.md).
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------
USER_AGENT = "ai-pulse/0.1 (personal aggregator)"
HTTP_TIMEOUT_SECONDS = 15.0

# ---------------------------------------------------------------------------
# Categories (five buckets + other). key -> human label.
# ---------------------------------------------------------------------------
CATEGORY_MODEL = "model"
CATEGORY_PRODUCT = "product"
CATEGORY_INDUSTRY = "industry"
CATEGORY_PAPER = "paper"
CATEGORY_TECHNIQUE = "technique"
CATEGORY_OTHER = "other"

CATEGORIES: list[tuple[str, str]] = [
    (CATEGORY_MODEL, "Models"),
    (CATEGORY_PRODUCT, "Products"),
    (CATEGORY_INDUSTRY, "Industry"),
    (CATEGORY_PAPER, "Papers"),
    (CATEGORY_TECHNIQUE, "Techniques"),
    (CATEGORY_OTHER, "Other"),
]
CATEGORY_KEYS = [k for k, _ in CATEGORIES]
CATEGORY_LABELS = dict(CATEGORIES)

# Source types
SOURCE_TYPE_RSS = "rss"
SOURCE_TYPE_HN = "hackernews"
SOURCE_TYPE_ARXIV = "arxiv"
SOURCE_TYPES = (SOURCE_TYPE_RSS, SOURCE_TYPE_HN, SOURCE_TYPE_ARXIV)

# ---------------------------------------------------------------------------
# Keyword rules for categorize() (lowercased substring match; first hit wins by
# the order applied in the usecase). Each list doubles as tag candidates.
# ---------------------------------------------------------------------------
KEYWORDS_MODEL = [
    "model", "gpt", "llm", "transformer", "weights", "parameter", "checkpoint",
    "fine-tune", "fine tune", "fine-tuning", "fine tuning", "pretrain", "pretrained",
    "pre-train", "foundation model", "multimodal", "diffusion", "embedding",
    "quantization", "quantized", "distillation", "mixture of experts", "moe",
    "claude", "gemini", "llama", "mistral", "qwen", "deepseek",
    "模型", "参数", "大模型", "权重", "微调", "蒸馏", "量化", "预训练",
]
KEYWORDS_PRODUCT = [
    "launch", "launches", "launched", "release", "released", "releases", "product",
    "api", "app", "available", "availability", "introducing", "introduces",
    "now in", "ga ", "general availability", "open source", "open-source",
    "opensource", "preview", "beta", "rollout", "ship", "ships", "shipped",
    "发布", "上线", "产品", "推出", "正式", "开放", "开源", "上市", "公测", "内测",
]
KEYWORDS_INDUSTRY = [
    "funding", "fund", "raise", "raises", "raised", "acquire", "acquisition",
    "acquires", "ipo", "valuation", "policy", "regulation", "regulatory", "market",
    "lawsuit", "antitrust", "invest", "investment", "investor", "startup",
    "partnership", "layoff", "revenue",
    "融资", "收购", "政策", "行业", "市场", "监管", "投资", "创业", "估值", "合作",
]
KEYWORDS_TECHNIQUE = [
    "how to", "tutorial", "guide", "prompt", "prompting", "prompt engineering",
    "technique", "tips", "best practices", "rag", "retrieval", "agent", "agents",
    "agentic", "workflow", "benchmark", "benchmarks", "dataset", "datasets",
    "evaluation", "eval", "reasoning", "inference", "chain of thought", "context window",
    "技巧", "教程", "实践", "提示词", "指南", "推理", "智能体", "数据集", "评测", "基准",
]

# Keyword groups used both for classification and tag extraction.
CATEGORY_KEYWORDS: list[tuple[str, list[str]]] = [
    (CATEGORY_MODEL, KEYWORDS_MODEL),
    (CATEGORY_PRODUCT, KEYWORDS_PRODUCT),
    (CATEGORY_INDUSTRY, KEYWORDS_INDUSTRY),
    (CATEGORY_TECHNIQUE, KEYWORDS_TECHNIQUE),
]

# ---------------------------------------------------------------------------
# RSS feeds: stable AI official / media feeds (title/link/summary/author only).
# ---------------------------------------------------------------------------
RSS_FEEDS: list[dict[str, str]] = [
    {"name": "OpenAI Blog", "url": "https://openai.com/blog/rss.xml"},
    {"name": "Google DeepMind Blog", "url": "https://deepmind.google/blog/rss.xml"},
    {"name": "Hugging Face Blog", "url": "https://huggingface.co/blog/feed.xml"},
    {"name": "The Gradient", "url": "https://thegradient.pub/rss/"},
    {"name": "BAIR Blog", "url": "https://bair.berkeley.edu/blog/feed.xml"},
    {"name": "MIT News - AI", "url": "https://news.mit.edu/rss/topic/artificial-intelligence2"},
    {"name": "Google AI Blog", "url": "https://blog.google/technology/ai/rss/"},
    {"name": "MarkTechPost", "url": "https://www.marktechpost.com/feed/"},
]

# ---------------------------------------------------------------------------
# Hacker News (Algolia search-by-date API)
# ---------------------------------------------------------------------------
HN_SEARCH_URL = "https://hn.algolia.com/api/v1/search_by_date"
HN_QUERIES = ["AI", "LLM", "GPT"]
HN_MIN_POINTS = 30
HN_SOURCE_NAME = "Hacker News"
HN_HITS_PER_PAGE = 50

# ---------------------------------------------------------------------------
# arXiv API
# ---------------------------------------------------------------------------
ARXIV_API_URL = "https://export.arxiv.org/api/query"
ARXIV_SEARCH_QUERY = "cat:cs.AI+OR+cat:cs.CL+OR+cat:cs.LG"
ARXIV_MAX_RESULTS = 50
ARXIV_SOURCE_NAME = "arXiv cs.AI"

# ---------------------------------------------------------------------------
# Auth / session
# ---------------------------------------------------------------------------
SESSION_COOKIE_NAME = "session_id"
SESSION_TTL_SECONDS = 7 * 24 * 3600  # 7 days
LOGIN_FAIL_LIMIT = 5
LOGIN_LOCK_SECONDS = 60

# Cache key prefixes (ai-pulse:<域>:<实体>)
CACHE_PREFIX = "ai-pulse"
SESSION_KEY_PREFIX = f"{CACHE_PREFIX}:session"
LOGIN_FAIL_KEY_PREFIX = f"{CACHE_PREFIX}:loginfail"

# Default seed account (placeholder; warn to change on startup)
DEFAULT_ADMIN_EMAIL = "admin@ai-pulse.local"
DEFAULT_ADMIN_PASSWORD = "changeme-admin-2026"
