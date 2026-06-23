import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { FeedList } from '@/components/feed/FeedList';
import { renderWithProviders } from './utils';
import type { Item } from '@/lib/types';

function makeItem(over: Partial<Item> = {}): Item {
  return {
    id: '1',
    source_type: 'rss',
    source_name: 'OpenAI Blog',
    title: '示例标题',
    title_zh: null,
    url: 'https://example.com/post',
    summary: '这是一段摘要文本。',
    summary_zh: null,
    author: null,
    category: 'model',
    tags: ['llm', 'release'],
    image_url: null,
    score: null,
    published_at: '2026-06-22T10:00:00',
    ...over,
  };
}

describe('FeedList', () => {
  it('links the title to the in-site detail page and keeps an external original link', () => {
    const items = [
      makeItem({ id: '1', title: '模型发布', url: 'https://a.test' }),
      makeItem({ id: '2', title: '产品更新', url: 'https://b.test', category: 'product' }),
    ];
    renderWithProviders(<FeedList items={items} grouped={false} />);

    // The title now opens the in-site detail page (no target=_blank).
    const titleLink = screen.getByRole('link', { name: /模型发布/ });
    expect(titleLink).toHaveAttribute('href', '/item/1');
    expect(titleLink).not.toHaveAttribute('target', '_blank');

    // A small secondary "original" link still points to the source url.
    const originalLinks = screen.getAllByRole('link', { name: /原文/ });
    expect(originalLinks[0]).toHaveAttribute('href', 'https://a.test');
    expect(originalLinks[0]).toHaveAttribute('target', '_blank');
    expect(screen.getByText('产品更新')).toBeInTheDocument();
  });

  it('renders source name, category label and tags', () => {
    renderWithProviders(<FeedList items={[makeItem()]} grouped={false} />);
    expect(screen.getByText('OpenAI Blog')).toBeInTheDocument();
    expect(screen.getByText('模型')).toBeInTheDocument();
    expect(screen.getByText('llm')).toBeInTheDocument();
  });

  it('shows date group headings when grouped', () => {
    const items = [makeItem({ id: '1', published_at: '2026-06-22T10:00:00' })];
    renderWithProviders(<FeedList items={items} grouped />);
    expect(screen.getAllByTestId('item-card')).toHaveLength(1);
  });
});
