import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegister } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { ApiError } from '@/api/client';
import { useT } from '@/i18n/I18nProvider';
import { getErrorMessage } from '@/i18n/errors';

/**
 * Self-service registration. Same branded card as the login screen (pulse-
 * waveform backdrop + glass card) so sign-up and sign-in feel like one flow.
 * Creating an account logs the user straight in.
 */
export function RegisterPage(): React.JSX.Element {
  const navigate = useNavigate();
  const t = useT();
  const status = useAuthStore((s) => s.status);
  const register = useRegister();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mismatch, setMismatch] = useState(false);
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
    if (register.isPending) return;
    if (password !== confirm) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    register.mutate(
      { email: email.trim(), password },
      { onSuccess: () => navigate('/', { replace: true }) },
    );
  };

  const apiError =
    register.isError &&
    register.error instanceof ApiError &&
    register.error.code === 'AUTH_EMAIL_EXISTS'
      ? t('register.emailExists')
      : register.isError
        ? getErrorMessage(register.error, t)
        : null;
  const errorText = mismatch ? t('register.passwordMismatch') : apiError;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Same signature backdrop as the login screen. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.10] blur-[130px]" />
        <svg
          className="absolute left-0 top-1/2 h-44 w-full -translate-y-1/2 text-accent/[0.07]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M0 60 H250 L286 60 L308 26 L334 96 L360 18 L386 60 L430 60 H650 L686 60 L708 26 L734 96 L760 18 L786 60 L830 60 H1200" />
        </svg>
      </div>

      <div className="relative w-full max-w-[400px]">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/95 p-8 shadow-[0_1px_2px_rgba(2,8,23,0.05),0_28px_56px_-28px_rgba(2,8,23,0.28)] backdrop-blur-sm sm:p-9">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
          />

          <div className="flex flex-col items-center text-center">
            <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 ring-1 ring-inset ring-accent/30">
              <span aria-hidden className="absolute inset-0 rounded-2xl bg-accent/25 blur-md" />
              <svg
                viewBox="0 0 24 24"
                className="relative h-7 w-7 text-accent"
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
            <h1 className="mt-5 text-[22px] font-semibold tracking-tight">
              AI <span className="text-accent">Pulse</span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{t('register.subtitle')}</p>
          </div>

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
                  className="h-11 pl-9"
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
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('register.passwordHint')}
                  className="h-11 pl-9 pr-10"
                  minLength={8}
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

            <div className="space-y-1.5">
              <label htmlFor="confirm" className="text-sm font-medium">
                {t('register.confirmPassword')}
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    if (mismatch) setMismatch(false);
                  }}
                  placeholder={t('register.confirmPlaceholder')}
                  className="h-11 pl-9"
                  required
                />
              </div>
            </div>

            {errorText && (
              <p className="text-sm text-destructive" role="alert">
                {errorText}
              </p>
            )}

            <Button
              type="submit"
              className="mt-1 h-11 w-full text-[15px]"
              variant="accent"
              disabled={register.isPending}
            >
              {register.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {register.isPending ? t('register.submitting') : t('register.submit')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('register.haveAccount')}{' '}
            <Link to="/login" className="font-medium text-accent hover:underline">
              {t('register.loginLink')}
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground/70">
          {t('login.disclaimer')}
        </p>
      </div>
    </div>
  );
}
