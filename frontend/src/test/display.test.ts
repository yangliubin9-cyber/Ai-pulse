import { describe, it, expect } from 'vitest';
import { displayTitle, displaySummary, displayBody, hasTranslation, hasBody } from '@/lib/display';
import type { Item } from '@/lib/types';

function makeItem(over: Partial<Item> = {}): Item {
  return {
    id: '1',
    source_type: 'rss',
    source_name: 'OpenAI Blog',
    title: 'English Title',
    title_zh: '中文标题',
    url: 'https://example.com/post',
    summary: 'English summary.',
    summary_zh: '中文摘要。',
    reason_zh: null,
    author: null,
    category: 'model',
    tags: [],
    image_url: null,
    score: null,
    published_at: '2026-06-22T10:00:00',
    ...over,
  };
}

describe('displayTitle', () => {
  it('uses the Chinese translation in zh when present', () => {
    expect(displayTitle(makeItem(), 'zh')).toBe('中文标题');
  });

  it('falls back to the original in zh when the translation is missing', () => {
    expect(displayTitle(makeItem({ title_zh: null }), 'zh')).toBe('English Title');
  });

  it('falls back to the original in zh when the translation is an empty string', () => {
    expect(displayTitle(makeItem({ title_zh: '' }), 'zh')).toBe('English Title');
  });

  it('uses the original in en even when a translation exists', () => {
    expect(displayTitle(makeItem(), 'en')).toBe('English Title');
  });
});

describe('displaySummary', () => {
  it('uses the Chinese translation in zh when present', () => {
    expect(displaySummary(makeItem(), 'zh')).toBe('中文摘要。');
  });

  it('falls back to the original in zh when the translation is missing', () => {
    expect(displaySummary(makeItem({ summary_zh: null }), 'zh')).toBe('English summary.');
  });

  it('uses the original in en even when a translation exists', () => {
    expect(displaySummary(makeItem(), 'en')).toBe('English summary.');
  });

  it('returns null when there is no summary at all (zh)', () => {
    expect(displaySummary(makeItem({ summary: null, summary_zh: null }), 'zh')).toBeNull();
  });

  it('returns null when there is no original summary (en)', () => {
    expect(displaySummary(makeItem({ summary: null }), 'en')).toBeNull();
  });
});

describe('displayBody', () => {
  it('uses content_zh in zh when present', () => {
    expect(
      displayBody(makeItem({ content: 'English body.', content_zh: '中文正文。' }), 'zh'),
    ).toBe('中文正文。');
  });

  it('falls back to content in zh when content_zh is missing', () => {
    expect(
      displayBody(makeItem({ content: 'English body.', content_zh: null }), 'zh'),
    ).toBe('English body.');
  });

  it('falls back to summary_zh in zh when there is no content at all', () => {
    expect(
      displayBody(
        makeItem({ content: null, content_zh: null, summary_zh: '中文摘要。' }),
        'zh',
      ),
    ).toBe('中文摘要。');
  });

  it('falls back to summary in zh when nothing else is available', () => {
    expect(
      displayBody(
        makeItem({ content: null, content_zh: null, summary_zh: null, summary: 'Plain summary.' }),
        'zh',
      ),
    ).toBe('Plain summary.');
  });

  it('uses the original content in en even when a translation exists', () => {
    expect(
      displayBody(makeItem({ content: 'English body.', content_zh: '中文正文。' }), 'en'),
    ).toBe('English body.');
  });

  it('falls back to summary in en when there is no content', () => {
    expect(
      displayBody(makeItem({ content: null, content_zh: '中文正文。' }), 'en'),
    ).toBe('English summary.');
  });

  it('returns null when no body text is available in either language path', () => {
    expect(
      displayBody(
        makeItem({ content: null, content_zh: null, summary: null, summary_zh: null }),
        'zh',
      ),
    ).toBeNull();
    expect(
      displayBody(
        makeItem({ content: null, content_zh: null, summary: null, summary_zh: null }),
        'en',
      ),
    ).toBeNull();
  });

  it('treats empty strings as absent and continues down the fallback chain', () => {
    expect(
      displayBody(makeItem({ content_zh: '', content: '', summary_zh: '中文摘要。' }), 'zh'),
    ).toBe('中文摘要。');
  });
});

describe('hasTranslation', () => {
  it('is true when any translatable field has a translation', () => {
    expect(hasTranslation(makeItem())).toBe(true);
    expect(hasTranslation(makeItem({ summary_zh: null }))).toBe(true);
    expect(hasTranslation(makeItem({ title_zh: null }))).toBe(true);
  });

  it('is true when only the body translation (content_zh) is present', () => {
    expect(
      hasTranslation(makeItem({ title_zh: null, summary_zh: null, content_zh: '中文正文。' })),
    ).toBe(true);
  });

  it('is false when no field has a translation', () => {
    expect(hasTranslation(makeItem({ title_zh: null, summary_zh: null }))).toBe(false);
    expect(hasTranslation(makeItem({ title_zh: '', summary_zh: '' }))).toBe(false);
    expect(
      hasTranslation(makeItem({ title_zh: null, summary_zh: null, content_zh: null })),
    ).toBe(false);
  });
});

describe('hasBody', () => {
  it('is true when the original content is present', () => {
    expect(hasBody(makeItem({ content: 'English body.' }))).toBe(true);
  });

  it('is true when only the translated content is present', () => {
    expect(hasBody(makeItem({ content: null, content_zh: '中文正文。' }))).toBe(true);
  });

  it('is false when neither content field is present', () => {
    expect(hasBody(makeItem({ content: null, content_zh: null }))).toBe(false);
    expect(hasBody(makeItem())).toBe(false);
    expect(hasBody(makeItem({ content: '', content_zh: '' }))).toBe(false);
  });
});
