import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from '@/pages/LoginPage';
import { useAuthStore } from '@/store/authStore';
import { renderWithProviders } from './utils';

describe('LoginPage form', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, status: 'anonymous' });
  });

  it('focuses the email field and exposes correct autocomplete', () => {
    renderWithProviders(<LoginPage />, { route: '/login' });
    const email = screen.getByLabelText('邮箱');
    expect(email).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('密码')).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login' });

    const password = screen.getByLabelText('密码');
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: '显示密码' }));
    expect(password).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: '隐藏密码' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('requires email and password before native submit', () => {
    renderWithProviders(<LoginPage />, { route: '/login' });
    expect(screen.getByLabelText('邮箱')).toBeRequired();
    expect(screen.getByLabelText('密码')).toBeRequired();
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
  });
});
