import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';
import { renderWithProviders } from './utils';

describe('AppShell', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 'u1', email: 'tester@example.com' },
      status: 'authenticated',
    });
  });

  it('renders the wordmark and primary navigation', () => {
    renderWithProviders(
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<div>内容区</div>} />
        </Route>
      </Routes>,
    );

    expect(screen.getByText('精选')).toBeInTheDocument();
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('AI 日报')).toBeInTheDocument();
    expect(screen.getByText('来源')).toBeInTheDocument();
  });

  it('shows the current user email and renders the outlet', () => {
    renderWithProviders(
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<div>内容区</div>} />
        </Route>
      </Routes>,
    );

    expect(screen.getByText('tester@example.com')).toBeInTheDocument();
    expect(screen.getByText('内容区')).toBeInTheDocument();
  });
});
