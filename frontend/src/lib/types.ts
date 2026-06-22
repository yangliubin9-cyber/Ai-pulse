/** Shared domain types matching the backend API contract. */

export type CategoryKey =
  | 'model'
  | 'product'
  | 'industry'
  | 'paper'
  | 'technique'
  | 'other';

export type SourceType = 'rss' | 'hackernews' | 'arxiv' | 'blog' | string;

export interface Item {
  id: string;
  source_type: SourceType;
  source_name: string;
  title: string;
  url: string;
  summary: string | null;
  author: string | null;
  category: CategoryKey;
  tags: string[];
  image_url: string | null;
  score: number | null;
  published_at: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface Category {
  key: CategoryKey;
  label: string;
  count: number;
}

export interface Source {
  name: string;
  source_type: SourceType;
  count: number;
  last_fetch_at: string | null;
}

export interface Stats {
  total_items: number;
  sources: number;
  last_fetch_at: string | null;
  window_days: number;
}

export interface DailyResponse {
  date: string;
  items: Item[];
}

export interface IngestResult {
  fetched: number;
  new: number;
  by_source: Record<string, number>;
}

export interface User {
  id: string;
  email: string;
}

export interface ItemsQuery {
  category?: CategoryKey;
  source_type?: string;
  featured?: boolean;
  page?: number;
  page_size?: number;
}
