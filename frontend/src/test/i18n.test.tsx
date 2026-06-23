import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { translate, resources } from '@/i18n';
import { zh } from '@/i18n/zh';
import { en } from '@/i18n/en';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';
import { renderWithProviders } from './utils';

/** Flatten a nested string dictionary into a set of dotted leaf paths. */
function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') {
      keys.push(...flattenKeys(value as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

describe('translate() interpolation', () => {
  it('interpolates vars for zh', () => {
    expect(
      translate('zh', resources.zh, 'pagination.pageInfo', {
        page: 1,
        total: 10,
        count: 194,
      }),
    ).toBe('第 1 / 10 页 · 共 194 条');
  });

  it('interpolates vars for en', () => {
    expect(
      translate('en', resources.en, 'pagination.pageInfo', {
        page: 1,
        total: 10,
        count: 194,
      }),
    ).toBe('Page 1 / 10 · 194 items');
  });

  it('returns the key itself for a missing path', () => {
    // Cast through unknown since this key intentionally does not exist.
    const missing = 'does.not.exist' as unknown as Parameters<typeof translate>[2];
    expect(translate('zh', resources.zh, missing)).toBe('does.not.exist');
  });
});

describe('zh/en key alignment', () => {
  it('has exactly the same key set in both languages', () => {
    const zhKeys = new Set(flattenKeys(zh));
    const enKeys = new Set(flattenKeys(en));

    const onlyZh = [...zhKeys].filter((k) => !enKeys.has(k));
    const onlyEn = [...enKeys].filter((k) => !zhKeys.has(k));

    expect(onlyZh).toEqual([]);
    expect(onlyEn).toEqual([]);
    expect(zhKeys.size).toBe(enKeys.size);
  });
});

describe('language switching in the UI', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: { id: 'u1', email: 'tester@example.com' },
      status: 'authenticated',
    });
  });

  it('defaults to Chinese, then switches to English instantly', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<div>content</div>} />
        </Route>
      </Routes>,
    );

    // Default Chinese chrome.
    expect(screen.getByText('精选')).toBeInTheDocument();
    expect(screen.getByText('全部 AI 动态')).toBeInTheDocument();

    // Switch to English via the language switcher.
    await user.click(screen.getByRole('radio', { name: 'EN' }));

    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getByText('All AI News')).toBeInTheDocument();
    expect(screen.queryByText('精选')).not.toBeInTheDocument();
  });
});
