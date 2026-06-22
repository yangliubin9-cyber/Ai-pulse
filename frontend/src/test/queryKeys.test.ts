import { describe, it, expect } from 'vitest';
import { queryKeys } from '@/api/queryKeys';

describe('queryKeys factory', () => {
  it('namespaces every key under the root', () => {
    expect(queryKeys.all).toEqual(['ai-pulse']);
    expect(queryKeys.me()[0]).toBe('ai-pulse');
    expect(queryKeys.stats()[0]).toBe('ai-pulse');
  });

  it('encodes item list params into the key', () => {
    const key = queryKeys.itemList({ featured: true, page: 2 });
    expect(key).toEqual(['ai-pulse', 'items', 'list', { featured: true, page: 2 }]);
  });

  it('produces stable keys for the same params', () => {
    const a = queryKeys.itemList({ category: 'model', page: 1 });
    const b = queryKeys.itemList({ category: 'model', page: 1 });
    expect(a).toEqual(b);
  });

  it('differentiates item detail by id', () => {
    expect(queryKeys.itemDetail('a')).not.toEqual(queryKeys.itemDetail('b'));
    expect(queryKeys.itemDetail('a')).toContain('a');
  });

  it('defaults daily to latest when no date given', () => {
    expect(queryKeys.daily()).toContain('latest');
    expect(queryKeys.daily('2026-06-22')).toContain('2026-06-22');
  });
});
