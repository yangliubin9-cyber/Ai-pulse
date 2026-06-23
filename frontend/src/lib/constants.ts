import type { CategoryKey } from './types';
import type { TFn } from '@/i18n/I18nProvider';
import type { TKey } from '@/i18n';

/** Category metadata. Labels are i18n keys resolved at render time. */
export interface CategoryMeta {
  key: CategoryKey;
  /** i18n key for the display label, e.g. 'category.model'. */
  labelKey: TKey;
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
  model: { key: 'model', labelKey: 'category.model', colorVar: 'model' },
  product: { key: 'product', labelKey: 'category.product', colorVar: 'product' },
  industry: { key: 'industry', labelKey: 'category.industry', colorVar: 'industry' },
  paper: { key: 'paper', labelKey: 'category.paper', colorVar: 'paper' },
  technique: { key: 'technique', labelKey: 'category.technique', colorVar: 'technique' },
  other: { key: 'other', labelKey: 'category.other', colorVar: 'other' },
};

/** Localized display label for a category key. */
export function categoryLabel(key: CategoryKey, t: TFn): string {
  return t((CATEGORY_META[key] ?? CATEGORY_META.other).labelKey);
}

/** Known source types mapped to their i18n label keys. */
const SOURCE_TYPE_KEYS: Record<string, TKey> = {
  rss: 'sourceType.rss',
  blog: 'sourceType.blog',
  hackernews: 'sourceType.hackernews',
  arxiv: 'sourceType.arxiv',
};

/** Localized display label for a source type; unknown types echo back as-is. */
export function sourceTypeLabel(type: string, t: TFn): string {
  const key = SOURCE_TYPE_KEYS[type];
  return key ? t(key) : type;
}

export const PAGE_SIZE = 20;
