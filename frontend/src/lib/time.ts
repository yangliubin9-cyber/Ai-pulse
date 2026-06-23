/** Date/time helpers for the feed. Pure, no React — language passed in. */

import type { Lang } from '@/i18n';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

const ZH_WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** "Jun 17" style month-day, localized via Intl. */
function monthDay(d: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    month: lang === 'zh' ? 'numeric' : 'short',
    day: 'numeric',
  }).format(d);
}

/** "Jun 17, Mon" style month-day-weekday, localized via Intl (en) or zh format. */
function monthDayWeekday(d: Date, lang: Lang): string {
  if (lang === 'zh') {
    return `${d.getMonth() + 1}月${d.getDate()}日 ${ZH_WEEKDAYS[d.getDay()]}`;
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(d);
}

/** Relative time, localized: "刚刚"/"Just now", "5m ago", "Jun 17"… */
export function relativeTime(iso: string, lang: Lang, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const diff = now.getTime() - then.getTime();

  if (lang === 'zh') {
    if (diff < 60_000) return '刚刚';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`;
  } else {
    if (diff < 60_000) return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  }

  const dayDiff = Math.round((startOfDay(now) - startOfDay(then)) / DAY_MS);
  if (dayDiff === 1) return lang === 'zh' ? '昨天' : 'Yesterday';
  if (dayDiff < 7) return lang === 'zh' ? `${dayDiff}天前` : `${dayDiff} days ago`;

  return monthDay(then, lang);
}

/** Group heading, localized: "今天"/"Today", "Jun 17, Mon"… */
export function dateGroupLabel(iso: string, lang: Lang, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return lang === 'zh' ? '未知日期' : 'Unknown date';
  const dayDiff = Math.round((startOfDay(now) - startOfDay(then)) / DAY_MS);
  if (dayDiff <= 0) return lang === 'zh' ? '今天' : 'Today';
  if (dayDiff === 1) return lang === 'zh' ? '昨天' : 'Yesterday';
  return monthDayWeekday(then, lang);
}

/** Stable day key (YYYY-MM-DD in local time) for grouping. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'unknown';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Local clock time as HH:MM, used in the timeline gutter. */
export function timeOfDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** ISO date (YYYY-MM-DD) for <input type="date"> defaults. */
export function todayInputValue(now: Date = new Date()): string {
  return dayKey(now.toISOString());
}

/** Parse a YYYY-MM-DD value into a local Date at midnight. */
function parseDateValue(value: string): Date {
  const [y, m, d] = value.split('-').map((n) => Number.parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Shift a YYYY-MM-DD value by `days` and return a YYYY-MM-DD value. */
export function shiftDateValue(value: string, days: number): string {
  const d = parseDateValue(value);
  if (Number.isNaN(d.getTime())) return value;
  d.setDate(d.getDate() + days);
  return todayInputValue(d);
}

/**
 * Long, localized day header for a YYYY-MM-DD value:
 * zh -> "2026年6月23日 · 周一", en -> "Monday, Jun 23, 2026".
 */
export function longDateLabel(value: string, lang: Lang): string {
  const d = parseDateValue(value);
  if (Number.isNaN(d.getTime())) return lang === 'zh' ? '未知日期' : 'Unknown date';
  if (lang === 'zh') {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · ${ZH_WEEKDAYS[d.getDay()]}`;
  }
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/** Group a list of items by local day, preserving input order within a day. */
export function groupByDay<T>(
  items: T[],
  getIso: (item: T) => string,
  lang: Lang,
): Array<{ key: string; label: string; items: T[] }> {
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const k = dayKey(getIso(item));
    const arr = buckets.get(k);
    if (arr) arr.push(item);
    else buckets.set(k, [item]);
  }
  return Array.from(buckets.entries()).map(([key, groupItems]) => ({
    key,
    label: dateGroupLabel(getIso(groupItems[0]), lang),
    items: groupItems,
  }));
}
