/** Date/time helpers for the feed. Pure, no React. */

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Relative time like "3分钟前" / "2小时前" / "昨天" / "6月12日". */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const diff = now.getTime() - then.getTime();

  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`;

  const dayDiff = Math.round((startOfDay(now) - startOfDay(then)) / DAY_MS);
  if (dayDiff === 1) return '昨天';
  if (dayDiff < 7) return `${dayDiff}天前`;

  return `${then.getMonth() + 1}月${then.getDate()}日`;
}

/** Group heading: "今天" / "昨天" / "6月12日 周三". */
export function dateGroupLabel(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '未知日期';
  const dayDiff = Math.round((startOfDay(now) - startOfDay(then)) / DAY_MS);
  if (dayDiff <= 0) return '今天';
  if (dayDiff === 1) return '昨天';

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${then.getMonth() + 1}月${then.getDate()}日 ${weekdays[then.getDay()]}`;
}

/** Stable day key (YYYY-MM-DD in local time) for grouping. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'unknown';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** ISO date (YYYY-MM-DD) for <input type="date"> defaults. */
export function todayInputValue(now: Date = new Date()): string {
  return dayKey(now.toISOString());
}

/** Group a list of items by local day, preserving input order within a day. */
export function groupByDay<T>(
  items: T[],
  getIso: (item: T) => string,
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
    label: dateGroupLabel(getIso(groupItems[0])),
    items: groupItems,
  }));
}
