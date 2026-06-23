import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/I18nProvider';
import { getErrorMessage } from '@/i18n/errors';

/**
 * Standalone login screen (no AppShell). Two-pane on wide screens: a quiet
 * brand panel and a focused form. Restrained, SaaS-style, not a templated face.
 */
export function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();
  const t = useT();
  const status = useAuthStore((s) => s.status);
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/', { replace: true });
    }
  }, [status, navigate]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (login.isPending) return;
    login.mutate(
      { email: email.trim(), password },
      { onSuccess: () => navigate('/', { replace: true }) },
    );
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <Logo className="text-lg text-white" />
        <div className="max-w-sm">
          <h2 className="text-2xl font-semibold leading-snug tracking-tight text-white">
            {t('login.valueProp1')}
            <br />
            {t('login.valueProp2Prefix')}
            <span className="text-accent">{t('login.valuePropTimeline')}</span>
            {t('login.valueProp2Suffix')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-sidebar-foreground/80">
            {t('login.description')}
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/60">{t('login.disclaimer')}</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo className="text-lg" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{t('login.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('login.subtitle')}</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                {t('login.email')}
              </label>
              <Input
                id="email"
                ref={emailRef}
                type="email"
                autoComplete="username"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                {t('login.password')}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {login.isError && (
              <p className="text-sm text-destructive" role="alert">
                {getErrorMessage(login.error, t)}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              variant="accent"
              disabled={login.isPending}
            >
              {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {login.isPending ? t('login.submitting') : t('login.submit')}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
