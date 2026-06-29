import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { ItemDetailPage } from '@/pages/ItemDetailPage';
import { ItemCard } from '@/components/feed/ItemCard';
import { ApiError } from '@/api/client';
import { renderWithProviders } from './utils';
import type { Item } from '@/lib/types';

// Mock the API layer so the page/hook resolve against canned data.
const detail = vi.fn();
vi.mock('@/api/endpoints', () => ({
  itemsApi: {
    detail: (id: string) => detail(id),
  },
}));

function makeItem(over: Partial<Item> = {}): Item {
  return {
    id: '42',
    source_type: 'rss',
    source_name: 'OpenAI Blog',
    title: '站内详情标题',
    title_zh: null,
    url: 'https://example.com/post',
    summary: '这是一段正文摘要。',
    summary_zh: null,
    reason_zh: null,
    author: 'openai',
    category: 'model',
    tags: ['llm'],
    image_url: null,
    score: 99,
    published_at: '2026-06-22T10:00:00',
    ...over,
  };
}

beforeEach(() => {
  detail.mockReset();
});

describe('ItemDetailPage', () => {
  it('renders the title, summary and a read-original link to the source url', async () => {
    detail.mockResolvedValue(makeItem());
    renderWithProviders(
      <Routes>
        <Route path="/item/:id" element={<ItemDetailPage />} />
      </Routes>,
      { route: '/item/42' },
    );

    expect(await screen.findByText('站内详情标题')).toBeInTheDocument();
    expect(screen.getByText('这是一段正文摘要。')).toBeInTheDocument();

    // Two read-original links (one above the body, the primary CTA below); both
    // point at the source url and open in a new tab.
    const originals = screen.getAllByRole('link', { name: /阅读原文/ });
    expect(originals.length).toBeGreaterThanOrEqual(1);
    for (const original of originals) {
      expect(original).toHaveAttribute('href', 'https://example.com/post');
      expect(original).toHaveAttribute('target', '_blank');
    }
    expect(detail).toHaveBeenCalledWith('42');
  });

  it('shows a no-summary hint when the item has no summary', async () => {
    detail.mockResolvedValue(makeItem({ summary: null }));
    renderWithProviders(
      <Routes>
        <Route path="/item/:id" element={<ItemDetailPage />} />
      </Routes>,
      { route: '/item/42' },
    );

    expect(await screen.findByText(/该来源仅提供标题/)).toBeInTheDocument();
  });

  it('defaults to the Chinese translation and toggles to the original', async () => {
    detail.mockResolvedValue(
      makeItem({
        title: 'Original English Title',
        title_zh: '中文标题',
        summary: 'Original English summary.',
        summary_zh: '中文摘要。',
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/item/:id" element={<ItemDetailPage />} />
      </Routes>,
      { route: '/item/42' },
    );

    // Translation shown by default in the zh UI.
    expect(await screen.findByText('中文标题')).toBeInTheDocument();
    expect(screen.getByText('中文摘要。')).toBeInTheDocument();
    expect(screen.queryByText('Original English Title')).not.toBeInTheDocument();

    // Toggle reveals the original.
    await user.click(screen.getByTestId('translation-toggle'));
    expect(screen.getByText('Original English Title')).toBeInTheDocument();
    expect(screen.getByText('Original English summary.')).toBeInTheDocument();
  });

  it('shows no translation toggle when no translation exists', async () => {
    detail.mockResolvedValue(makeItem());
    renderWithProviders(
      <Routes>
        <Route path="/item/:id" element={<ItemDetailPage />} />
      </Routes>,
      { route: '/item/42' },
    );

    expect(await screen.findByText('站内详情标题')).toBeInTheDocument();
    expect(screen.queryByTestId('translation-toggle')).not.toBeInTheDocument();
  });

  it('renders the full Chinese body as plain-text paragraphs when content exists', async () => {
    detail.mockResolvedValue(
      makeItem({
        summary: 'Short summary only.',
        summary_zh: '简短摘要。',
        content: 'English paragraph one.\n\nEnglish paragraph two.',
        content_zh: '第一段中文正文。\n\n第二段中文正文。',
      }),
    );
    renderWithProviders(
      <Routes>
        <Route path="/item/:id" element={<ItemDetailPage />} />
      </Routes>,
      { route: '/item/42' },
    );

    // The full translated body is shown, split into paragraphs — not the summary.
    expect(await screen.findByText('第一段中文正文。')).toBeInTheDocument();
    expect(screen.getByText('第二段中文正文。')).toBeInTheDocument();
    expect(screen.queryByText('简短摘要。')).not.toBeInTheDocument();

    const article = screen.getByTestId('article-body');
    // Plain-text rendering: no injected markup, and two distinct <p> blocks.
    expect(article.querySelectorAll('p')).toHaveLength(2);
  });

  it('toggles a full body between the translation and the original content', async () => {
    detail.mockResolvedValue(
      makeItem({
        content: 'The original English body.',
        content_zh: '中文译文正文。',
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/item/:id" element={<ItemDetailPage />} />
      </Routes>,
      { route: '/item/42' },
    );

    expect(await screen.findByText('中文译文正文。')).toBeInTheDocument();
    expect(screen.queryByText('The original English body.')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('translation-toggle'));
    expect(screen.getByText('The original English body.')).toBeInTheDocument();
  });

  it('renders body text as plain text without interpreting HTML (no XSS)', async () => {
    detail.mockResolvedValue(
      makeItem({
        content: 'plain',
        content_zh: '<img src=x onerror="alert(1)">注入文本',
      }),
    );
    renderWithProviders(
      <Routes>
        <Route path="/item/:id" element={<ItemDetailPage />} />
      </Routes>,
      { route: '/item/42' },
    );

    const article = await screen.findByTestId('article-body');
    // The angle-bracket string is shown verbatim as text, not parsed into an <img>.
    expect(article.textContent).toContain('<img src=x onerror="alert(1)">注入文本');
    expect(article.querySelector('img')).toBeNull();
  });

  it('keeps the no-content hint when the source has only a title (no body, no summary)', async () => {
    detail.mockResolvedValue(makeItem({ summary: null, content: null, content_zh: null }));
    renderWithProviders(
      <Routes>
        <Route path="/item/:id" element={<ItemDetailPage />} />
      </Routes>,
      { route: '/item/42' },
    );

    expect(await screen.findByText(/该来源仅提供标题/)).toBeInTheDocument();
    expect(screen.queryByTestId('article-body')).not.toBeInTheDocument();
  });

  it('renders a 404 state when the item is not found', async () => {
    detail.mockRejectedValue(new ApiError(404, 'NOT_FOUND', '', null));
    renderWithProviders(
      <Routes>
        <Route path="/item/:id" element={<ItemDetailPage />} />
      </Routes>,
      { route: '/item/missing' },
    );

    expect(await screen.findByTestId('detail-not-found')).toBeInTheDocument();
  });
});

describe('ItemCard navigation', () => {
  it('links the card title to the in-site /item/:id detail route', () => {
    renderWithProviders(<ItemCard item={makeItem({ id: '7', title: '卡片标题' })} />);
    const titleLink = screen.getByRole('link', { name: /卡片标题/ });
    expect(titleLink).toHaveAttribute('href', '/item/7');
  });

  it('navigates to the detail page when the card title is clicked', async () => {
    detail.mockResolvedValue(makeItem({ id: '7', title: '卡片标题' }));
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/" element={<ItemCard item={makeItem({ id: '7', title: '卡片标题' })} />} />
        <Route path="/item/:id" element={<ItemDetailPage />} />
      </Routes>,
      { route: '/' },
    );

    await user.click(screen.getByRole('link', { name: /卡片标题/ }));
    await waitFor(() => expect(detail).toHaveBeenCalledWith('7'));
    expect(await screen.findByTestId('item-detail')).toBeInTheDocument();
  });
});
