import { useEffect, useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from './queryClient';
import { router } from './router';
import { setAuthExpiredHandler } from '@/api/client';
import { useResolveSession } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { initSystemThemeListener } from '@/store/themeStore';
import { I18nProvider } from '@/i18n/I18nProvider';

/** Bridges global side-effects: session resolve, 401 handler, theme listener. */
function AppEffects(): null {
  useResolveSession();
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => initSystemThemeListener(), []);

  useEffect(() => {
    setAuthExpiredHandler(() => {
      clear();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    });
  }, [clear]);

  return null;
}

export function App(): React.JSX.Element {
  const queryClient = useMemo(() => createQueryClient(), []);
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <AppEffects />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </I18nProvider>
  );
}
