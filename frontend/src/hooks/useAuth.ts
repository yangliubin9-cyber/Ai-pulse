import { useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/endpoints';
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

export function useRegister() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.register(email, password),
    onSuccess: (data) => {
      // Registration logs the new account straight in.
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
