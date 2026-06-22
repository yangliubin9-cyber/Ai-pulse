import type { CategoryKey } from './types';

/** Chinese label + Tailwind tint class per category. */
export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  /** text/bg/border utility token suffix used for theming. */
  colorVar: string;
}

export const CATEGORY_ORDER: CategoryKey[] = [
  'model',
  'product',
  'industry',
  'paper',
  'technique',
  'other',
];

export const CATEGORY_META: Record<CategoryKey, CategoryMeta> = {
  model: { key: 'model', label: '模型', colorVar: 'model' },
  product: { key: 'product', label: '产品', colorVar: 'product' },
  industry: { key: 'industry', label: '行业', colorVar: 'industry' },
  paper: { key: 'paper', label: '论文', colorVar: 'paper' },
  technique: { key: 'technique', label: '技巧', colorVar: 'technique' },
  other: { key: 'other', label: '其他', colorVar: 'other' },
};

export function categoryLabel(key: CategoryKey): string {
  return CATEGORY_META[key]?.label ?? '其他';
}

/** Human-friendly label for a source type. */
export const SOURCE_TYPE_LABEL: Record<string, string> = {
  rss: 'RSS',
  blog: '博客',
  hackernews: 'Hacker News',
  arxiv: 'arXiv',
};

export function sourceTypeLabel(type: string): string {
  return SOURCE_TYPE_LABEL[type] ?? type;
}

export const PAGE_SIZE = 20;
