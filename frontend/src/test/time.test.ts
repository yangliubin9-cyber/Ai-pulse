import { describe, it, expect } from 'vitest';
import { relativeTime, dateGroupLabel, groupByDay, dayKey } from '@/lib/time';

describe('time helpers', () => {
  const now = new Date('2026-06-22T12:00:00');

  it('formats recent times relatively (zh)', () => {
    expect(relativeTime('2026-06-22T11:59:30', 'zh', now)).toBe('刚刚');
    expect(relativeTime('2026-06-22T11:30:00', 'zh', now)).toBe('30分钟前');
    expect(relativeTime('2026-06-22T09:00:00', 'zh', now)).toBe('3小时前');
    expect(relativeTime('2026-06-21T12:00:00', 'zh', now)).toBe('昨天');
  });

  it('formats recent times relatively (en)', () => {
    expect(relativeTime('2026-06-22T11:59:30', 'en', now)).toBe('Just now');
    expect(relativeTime('2026-06-22T11:30:00', 'en', now)).toBe('30m ago');
    expect(relativeTime('2026-06-22T09:00:00', 'en', now)).toBe('3h ago');
    expect(relativeTime('2026-06-21T12:00:00', 'en', now)).toBe('Yesterday');
  });

  it('labels date groups (zh)', () => {
    expect(dateGroupLabel('2026-06-22T08:00:00', 'zh', now)).toBe('今天');
    expect(dateGroupLabel('2026-06-21T08:00:00', 'zh', now)).toBe('昨天');
    expect(dateGroupLabel('2026-06-12T08:00:00', 'zh', now)).toContain('6月12日');
  });

  it('labels date groups (en)', () => {
    expect(dateGroupLabel('2026-06-22T08:00:00', 'en', now)).toBe('Today');
    expect(dateGroupLabel('2026-06-21T08:00:00', 'en', now)).toBe('Yesterday');
    expect(dateGroupLabel('2026-06-12T08:00:00', 'en', now)).toContain('Jun 12');
  });

  it('groups items by local day preserving order', () => {
    const items = [
      { id: '1', at: '2026-06-22T10:00:00' },
      { id: '2', at: '2026-06-22T09:00:00' },
      { id: '3', at: '2026-06-21T10:00:00' },
    ];
    const groups = groupByDay(items, (i) => i.at, 'zh');
    expect(groups).toHaveLength(2);
    expect(groups[0].items).toHaveLength(2);
    expect(groups[1].items[0].id).toBe('3');
  });

  it('produces a stable day key', () => {
    expect(dayKey('2026-06-22T23:00:00')).toBe('2026-06-22');
  });
});
