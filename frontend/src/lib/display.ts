/**
 * Display-preference helpers for news content. Pure, no React — language is
 * passed in by the caller (from useI18n's `lang`).
 *
 * Backend ships offline Chinese translations (`title_zh` / `summary_zh` /
 * `content_zh`) for English-origin items. The UI defaults to the Chinese
 * translation when the interface language is `zh` and a translation exists,
 * falling back to the original. In English the original is always shown (the
 * translation is Chinese and would be out of place in an English UI).
 *
 * All three display helpers share one generic core (`pick`) over a per-field
 * (zh field, source field) mapping; the language→field mapping lives only here.
 */

import type { Lang } from '@/i18n';
import type { Item } from './types';

/** The minimal translatable shape these helpers need from an item. */
type Translatable = Pick<Item, 'title' | 'title_zh' | 'summary' | 'summary_zh'>;

/** The shape `displayBody` needs: full body fields plus the summary fallback. */
type BodyTranslatable = Pick<
  Item,
  'content' | 'content_zh' | 'summary' | 'summary_zh'
>;

/** A nullable/optional string field — every translatable leaf is one of these. */
type Field = string | null | undefined;

/** First non-empty (trim-aware) field, or null when none qualify. */
function firstNonEmpty(...fields: Field[]): string | null {
  for (const f of fields) {
    if (f) return f;
  }
  return null;
}

/**
 * Generic per-field language pick: in `zh`, prefer the translated field and
 * fall back to the source field; in `en`, always the source field. Empty
 * strings are treated as absent.
 */
function pick(zhField: Field, srcField: Field, lang: Lang): string | null {
  return lang === 'zh' ? firstNonEmpty(zhField, srcField) : firstNonEmpty(srcField);
}

/**
 * Title to display: in `zh`, prefer `title_zh` and fall back to the original
 * `title`; in `en`, always the original. Title is always present, so this never
 * returns null in practice — typed `string` for callers' convenience.
 */
export function displayTitle(item: Translatable, lang: Lang): string {
  return pick(item.title_zh, item.title, lang) ?? item.title;
}

/**
 * Summary to display: in `zh`, prefer `summary_zh` and fall back to the
 * original `summary`; in `en`, always the original. Returns `null` when no
 * summary text is available in the chosen language path.
 */
export function displaySummary(item: Translatable, lang: Lang): string | null {
  return pick(item.summary_zh, item.summary, lang);
}

/**
 * Full article body to display, the longest text the item carries.
 *
 * In `zh` the fallback chain is: `content_zh` -> `content` -> `summary_zh` ->
 * `summary`. In `en` it is: `content` -> `summary`. Returns `null` when no body
 * text is available in the chosen language path (e.g. a HN link-only post with
 * no content and no summary). Always plain text — the caller must render it as
 * text, never as HTML.
 */
export function displayBody(item: BodyTranslatable, lang: Lang): string | null {
  return firstNonEmpty(
    pick(item.content_zh, item.content, lang),
    pick(item.summary_zh, item.summary, lang),
  );
}

/**
 * Whether a Chinese translation exists for any text field — used to decide if
 * the detail page should offer an original/translation toggle. Covers title,
 * summary and the full-body translation.
 */
export function hasTranslation(item: Translatable & Pick<Item, 'content_zh'>): boolean {
  return Boolean(item.title_zh) || Boolean(item.summary_zh) || Boolean(item.content_zh);
}

/**
 * Whether the item carries a full article body (vs. only a summary). Drives the
 * "Article" vs. summary-only heading and the source-attribution note. Checks
 * both the original and translated content fields.
 */
export function hasBody(item: Pick<Item, 'content' | 'content_zh'>): boolean {
  return Boolean(item.content) || Boolean(item.content_zh);
}
