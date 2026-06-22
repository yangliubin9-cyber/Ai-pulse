import { useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { useAuthStore } from '@/store/authStore';

/** Resolve the current session once on app start. */
export function useResolveSession(): void {
  const setUser = useAuthStore((s) => s.setUser);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status !== 'unknown') return;
    let active = true;
    authApi
      .me()
      .then((user) => {
        if (active) setUser(user);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, [status, setUser]);
}

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      setUser(data.user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clear();
      queryClient.clear();
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      authApi.changePassword(oldPassword, newPassword),
  });
}

/** Human-readable message for an auth error code. */
export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'AUTH_INVALID_CREDENTIALS':
        return '邮箱或密码错误';
      case 'AUTH_TOO_MANY_ATTEMPTS':
        return '尝试次数过多，请稍后再试';
      case 'UNAUTHORIZED':
        return '当前密码不正确';
      default:
        return error.message || '操作失败，请重试';
    }
  }
  return '网络异常，请检查连接后重试';
}

/** Returns a stable callback that clears auth and redirects to /login. */
export function useAuthExpiredRedirect(): () => void {
  const clear = useAuthStore((s) => s.clear);
  return useCallback(() => {
    clear();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
  }, [clear]);
}
