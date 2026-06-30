import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/I18nProvider';
import { getErrorMessage } from '@/i18n/errors';

/**
 * Standalone login screen: a single centered card on a quiet page — brand mark,
 * title, and a focused email + password form with icon-prefixed fields. Built
 * from surface tokens so it adapts to the light / dark theme. The self-drawn
 * pulse mark mirrors the app Logo (kept inline so it can be sized larger here).
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm sm:p-9">
          {/* Brand mark + title */}
          <div className="flex flex-col items-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 ring-1 ring-inset ring-accent/30">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7 text-accent"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M2 13 H7 L9.5 6 L13 18 L15.5 11 H22" />
              </svg>
            </span>
            <h1 className="mt-5 text-xl font-semibold tracking-tight">{t('login.title')}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{t('login.subtitle')}</p>
          </div>

          {/* Form */}
          <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                {t('login.email')}
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="email"
                  ref={emailRef}
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                {t('login.password')}
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  className="pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              className="mt-1 w-full"
              variant="accent"
              disabled={login.isPending}
            >
              {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {login.isPending ? t('login.submitting') : t('login.submit')}
            </Button>
          </form>
        </div>

        {/* Footer note below the card */}
        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground/70">
          {t('login.disclaimer')}
        </p>
      </div>
    </div>
  );
}
