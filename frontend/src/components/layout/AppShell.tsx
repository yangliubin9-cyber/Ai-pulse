import { memo, useCallback, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  CalendarDays,
  Radio,
  Bot,
  Info,
  ScrollText,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { useI18n, useT } from '@/i18n/I18nProvider';
import type { TKey } from '@/i18n';
import type { Lang } from '@/i18n';
import { cn } from '@/lib/cn';

interface NavEntry {
  to: string;
  labelKey: TKey;
  icon: LucideIcon;
  end?: boolean;
}

const CONTENT_NAV: NavEntry[] = [
  { to: '/', labelKey: 'nav.featured', icon: Sparkles, end: true },
  { to: '/all', labelKey: 'nav.all', icon: Layers },
  { to: '/daily', labelKey: 'nav.daily', icon: CalendarDays },
  { to: '/sources', labelKey: 'nav.sources', icon: Radio },
];

const ACCESS_NAV: NavEntry[] = [{ to: '/agent', labelKey: 'nav.agent', icon: Bot }];

const MORE_NAV: NavEntry[] = [
  { to: '/about', labelKey: 'nav.about', icon: Info },
  { to: '/changelog', labelKey: 'nav.changelog', icon: ScrollText },
  { to: '/feedback', labelKey: 'nav.feedback', icon: MessageSquare },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
];

/** Static option list for the language switcher — never changes at runtime. */
const LANG_OPTIONS: Array<{ value: Lang; labelKey: TKey }> = [
  { value: 'zh', labelKey: 'lang.zh' },
  { value: 'en', labelKey: 'lang.en' },
];

/**
 * Application shell: fixed dark navy sidebar (brand + grouped vertical nav +
 * theme/account footer) with a full-width content area — list/feed pages fill the
 * available width, while reading pages (detail, about, settings) constrain their
 * own column internally. On narrow screens the sidebar collapses behind a
 * slide-over toggle.
 */
export function AppShell(): React.JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useT();

  // Stable references so memoized sidebar children don't re-render needlessly.
  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={openMobile}
          className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-surface-muted hover:text-foreground"
          aria-label={t('nav.openNav')}
        >
          <Menu className="h-5 w-5" />
        </button>
        <Logo />
      </div>

      {/* Sidebar — fixed on desktop, slide-over on mobile */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label={t('nav.closeNav')}
          onClick={closeMobile}
        />
      )}
      <Sidebar mobileOpen={mobileOpen} onClose={closeMobile} />

      {/* Content column */}
      <div className="lg:pl-[15rem]">
        <main className="w-full px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}): React.JSX.Element {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const t = useT();

  const handleLogout = (): void => {
    logout.mutate(undefined, {
      onSettled: () => navigate('/login', { replace: true }),
    });
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-[15rem] flex-col border-r border-white/[0.06] bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-out',
        'lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
      aria-label={t('nav.mainNav')}
    >
      <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4">
        <NavLink to="/" onClick={onClose} className="text-[15px] text-white">
          <Logo />
        </NavLink>
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-md text-sidebar-foreground hover:bg-white/10 hover:text-white lg:hidden"
          aria-label={t('nav.closeNav')}
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <NavGroup title={t('nav.groupContent')}>
          {CONTENT_NAV.map((item) => (
            <SidebarLink key={item.to} item={item} onNavigate={onClose} />
          ))}
        </NavGroup>
        <NavGroup title={t('nav.groupAccess')}>
          {ACCESS_NAV.map((item) => (
            <SidebarLink key={item.to} item={item} onNavigate={onClose} />
          ))}
        </NavGroup>
        <NavGroup title={t('nav.groupMore')}>
          {MORE_NAV.map((item) => (
            <SidebarLink key={item.to} item={item} onNavigate={onClose} />
          ))}
        </NavGroup>
      </nav>

      <div className="border-t border-white/[0.08] px-3 py-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="px-1 text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/70">
            {t('theme.label')}
          </span>
          <ThemeToggle />
        </div>
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 px-1 text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/70">
            <Globe className="h-3.5 w-3.5" aria-hidden />
            {t('lang.label')}
          </span>
          <LangToggle />
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2.5 py-2 ring-1 ring-inset ring-white/[0.06]">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/20 text-[11px] font-semibold text-accent ring-1 ring-inset ring-accent/30">
            {(user?.email?.[0] ?? 'A').toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs text-sidebar-foreground/90">
            {user?.email ?? t('nav.accountFallback')}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-sidebar-foreground hover:bg-white/10 hover:text-white"
            aria-label={t('nav.logout')}
            title={t('nav.logout')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

/** Two-button language switcher (中 / EN). Persists + switches instantly. */
function LangToggle(): React.JSX.Element {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 p-0.5"
      role="radiogroup"
      aria-label={t('lang.switch')}
    >
      {LANG_OPTIONS.map(({ value, labelKey }) => {
        const active = value === lang;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(labelKey)}
            onClick={() => setLang(value)}
            className={cn(
              'grid h-7 min-w-7 place-items-center rounded-md px-1.5 text-[11px] font-medium transition-colors duration-150 ease-out',
              active
                ? 'bg-accent/20 text-accent'
                : 'text-sidebar-foreground hover:bg-white/10 hover:text-white',
            )}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}

function NavGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="mb-4">
      <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/55">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

const SidebarLink = memo(function SidebarLink({
  item,
  onNavigate,
}: {
  item: NavEntry;
  onNavigate: () => void;
}): React.JSX.Element {
  const Icon = item.icon;
  const t = useT();
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent/60',
          isActive
            ? 'bg-accent/[0.12] text-white'
            : 'text-sidebar-foreground hover:bg-white/5 hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent transition-opacity duration-150',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden
          />
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-colors duration-150',
              isActive ? 'text-accent' : 'text-current',
            )}
            aria-hidden
          />
          <span className="truncate">{t(item.labelKey)}</span>
        </>
      )}
    </NavLink>
  );
});
