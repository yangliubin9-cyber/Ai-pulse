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
  /** Offline Chinese translation of the title; null when unavailable. */
  title_zh: string | null;
  url: string;
  summary: string | null;
  /** Offline Chinese translation of the summary; null when unavailable. */
  summary_zh: string | null;
  /**
   * Full original body text from the source (plain text, HTML stripped by the
   * backend). Only returned by the detail endpoint; null when the source has no
   * body (e.g. a HN link-only post). Optional because list endpoints omit it.
   */
  content?: string | null;
  /**
   * Offline Chinese translation of `content`. Only returned by the detail
   * endpoint; null when unavailable. Optional because list endpoints omit it.
   */
  content_zh?: string | null;
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
  /** Free-text keyword search (backend filters title/summary). */
  q?: string;
  page?: number;
  page_size?: number;
}
