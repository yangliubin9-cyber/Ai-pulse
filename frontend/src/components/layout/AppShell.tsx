import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { config } from '@/lib/config';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { to: '/', label: '精选', end: true },
  { to: '/all', label: '全部', end: false },
  { to: '/daily', label: 'AI 日报', end: false },
  { to: '/sources', label: '来源', end: false },
];

/** Top-bar application shell: wordmark + primary nav + theme + user menu. */
export function AppShell(): React.JSX.Element {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    logout.mutate(undefined, {
      onSettled: () => navigate('/login', { replace: true }),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center gap-6">
          <NavLink to="/" className="shrink-0 text-base">
            <Logo />
          </NavLink>

          <nav className="flex items-center gap-1 text-sm" aria-label="主导航">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 font-medium transition-colors duration-150 ease-out',
                    isActive
                      ? 'bg-surface-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden max-w-[12rem] truncate sm:inline">
                    {user?.email ?? '账户'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user && (
                  <>
                    <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4" />
                  设置
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Outlet />
      </main>

      <footer className="border-t border-border py-6">
        <div className="container flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>AI Pulse · 公开来源 AI 资讯聚合精选</span>
          <span className="tabular-nums">v{config.version}</span>
        </div>
      </footer>
    </div>
  );
}
