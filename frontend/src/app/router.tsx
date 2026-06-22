import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { LoginPage } from '@/pages/LoginPage';
import { FeaturedPage } from '@/pages/FeaturedPage';
import { AllPage } from '@/pages/AllPage';
import { DailyPage } from '@/pages/DailyPage';
import { SourcesPage } from '@/pages/SourcesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <FeaturedPage /> },
      { path: 'all', element: <AllPage /> },
      { path: 'daily', element: <DailyPage /> },
      { path: 'sources', element: <SourcesPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
