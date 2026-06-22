import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';

/** Guards child routes: redirects to /login when not authenticated. */
export function RequireAuth({ children }: { children: React.ReactNode }): React.JSX.Element {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === 'unknown') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Skeleton className="mb-4 h-6 w-40" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
