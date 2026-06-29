import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { InlineMarkdown } from '@/components/feed/InlineMarkdown';
import { ItemCard } from '@/components/feed/ItemCard';
import { ItemDetailPage } from '@/pages/ItemDetailPage';
import { DailyPage } from '@/pages/DailyPage';
import { renderWithProviders } from './utils';
import type { DailyResponse, Item } from '@/lib/types';

// Mock both API layers so detail/daily resolve against canned data.
const detail = vi.fn();
const daily = vi.fn();
vi.mock('@/api/endpoints', () => ({
  itemsApi: { detail: (id: string) => detail(id) },
  catalogApi: { daily: (date: string | undefined) => daily(date) },
}));

function makeItem(over: Partial<Item> = {}): Item {
  return {
    id: '1',
    source_type: 'rss',
    source_name: 'OpenAI Blog',
    title: '示例标题',
    title_zh: null,
    url: 'https://example.com/post',
    summary: '一段摘要。',
    summary_zh: null,
    content: null,
    content_zh: null,
    reason_zh: null,
    author: null,
    category: 'model',
    tags: [],
    image_url: null,
    score: 50,
    published_at: '2026-06-23T10:00:00',
    ...over,
  };
}

beforeEach(() => {
  detail.mockReset();
  daily.mockReset();
});

describe('InlineMarkdown', () => {
  it('renders **bold** runs as <strong> and the rest as plain text', () => {
    renderWithProviders(<InlineMarkdown text="普通 **重点** 文本" />);
    const strong = screen.getByText('重点');
    expect(strong.tagName).toBe('STRONG');
    expect(screen.getByTestId('inline-markdown').textContent).toBe('普通 重点 文本');
  });

  it('does not interpret HTML (no XSS)', () => {
    renderWithProviders(<InlineMarkdown text={'<img src=x onerror="alert(1)">注入'} />);
    const root = screen.getByTestId('inline-markdown');
    expect(root.querySelector('img')).toBeNull();
    expect(root.textContent).toContain('<img src=x onerror="alert(1)">注入');
  });
});

describe('ItemCard recommendation strip', () => {
  it('shows the reason strip when reason_zh is present', () => {
    renderWithProviders(<ItemCard item={makeItem({ reason_zh: '**值得一看** 的更新' })} />);
    const strip = screen.getByTestId('card-reason');
    // Markdown markers stripped to plain text in the compact card.
    expect(strip.textContent).toContain('值得一看 的更新');
    expect(strip.querySelector('strong')).toBeNull();
  });

  it('hides the reason strip when reason_zh is absent', () => {
    renderWithProviders(<ItemCard item={makeItem({ reason_zh: null })} />);
    expect(screen.queryByTestId('card-reason')).not.toBeInTheDocument();
  });
});

describe('ItemCard content-first / link card', () => {
  it('shows the summary as the card body when present', () => {
    renderWithProviders(<ItemCard item={makeItem({ summary: '这是一段摘要内容。' })} />);
    expect(screen.getByText('这是一段摘要内容。')).toBeInTheDocument();
    // No link-only chip when there is real content.
    expect(screen.queryByText(/链接 ·/)).not.toBeInTheDocument();
  });

  it('shows a "链接 · host" line for a link-only item (no summary)', () => {
    renderWithProviders(
      <ItemCard
        item={makeItem({
          summary: null,
          summary_zh: null,
          url: 'https://www.github.com/foo/bar',
        })}
      />,
    );
    // www. stripped; presented as an intentional link card rather than empty.
    expect(screen.getByText(/链接 · github\.com/)).toBeInTheDocument();
  });
});

describe('ItemDetailPage double-box layout', () => {
  it('renders the reason box (markdown bold) and the body box together', async () => {
    detail.mockResolvedValue(
      makeItem({ reason_zh: '推荐它因为 **很重要**', summary: '正文摘要内容。' }),
    );
    renderWithProviders(
      <Routes>
        <Route path="/item/:id" element={<ItemDetailPage />} />
      </Routes>,
      { route: '/item/1' },
    );

    const reasonBox = await screen.findByTestId('reason-box');
    expect(reasonBox).toBeInTheDocument();
    expect(reasonBox.querySelector('strong')?.textContent).toBe('很重要');
    expect(screen.getByTestId('body-box')).toBeInTheDocument();
    expect(screen.getByText('正文摘要内容。')).toBeInTheDocument();
  });

  it('omits the reason box when reason_zh is absent', async () => {
    detail.mockResolvedValue(makeItem({ reason_zh: null }));
    renderWithProviders(
      <Routes>
        <Route path="/item/:id" element={<ItemDetailPage />} />
      </Routes>,
      { route: '/item/1' },
    );

    await screen.findByTestId('item-detail');
    expect(screen.queryByTestId('reason-box')).not.toBeInTheDocument();
  });

  it('keeps the reason box but drops the body box for a title-only HN item', async () => {
    detail.mockResolvedValue(
      makeItem({ summary: null, content: null, content_zh: null, reason_zh: '仍有理由' }),
    );
    renderWithProviders(
      <Routes>
        <Route path="/item/:id" element={<ItemDetailPage />} />
      </Routes>,
      { route: '/item/1' },
    );

    expect(await screen.findByTestId('reason-box')).toBeInTheDocument();
    expect(screen.queryByTestId('body-box')).not.toBeInTheDocument();
    expect(screen.getByText(/该来源仅提供标题/)).toBeInTheDocument();
  });
});

describe('DailyPage magazine layout', () => {
  it('groups items into numbered category sections and renders a reason line', async () => {
    const response: DailyResponse = {
      date: '2026-06-23',
      items: [
        makeItem({ id: 'a', title: '模型条目', category: 'model', reason_zh: '**模型** 亮点' }),
        makeItem({ id: 'b', title: '产品条目', category: 'product' }),
      ],
    };
    daily.mockResolvedValue(response);

    renderWithProviders(<DailyPage />);

    // Two category groups -> two numbered sections.
    const sections = await screen.findAllByTestId('daily-section');
    expect(sections).toHaveLength(2);

    // Titles link into the in-site detail route.
    expect(screen.getByRole('link', { name: '模型条目' })).toHaveAttribute('href', '/item/a');
    expect(screen.getByRole('link', { name: '产品条目' })).toHaveAttribute('href', '/item/b');

    // The reason line is shown (plain text, markers stripped) only where present.
    const reasonLines = screen.getAllByTestId('row-reason');
    expect(reasonLines).toHaveLength(1);
    expect(reasonLines[0].textContent).toContain('模型 亮点');
  });
});
