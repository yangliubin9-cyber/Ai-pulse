import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogin, authErrorMessage } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

/**
 * Standalone login screen (no AppShell). Two-pane on wide screens: a quiet
 * brand panel and a focused form. Restrained, SaaS-style, not a templated face.
 */
export function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();
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
      <aside className="relative hidden flex-col justify-between border-r border-border bg-surface-muted p-10 lg:flex">
        <Logo className="text-lg" />
        <div className="max-w-sm">
          <h2 className="text-2xl font-semibold leading-snug tracking-tight">
            把每天的 AI 动态，
            <br />
            收敛成一条清晰的时间线。
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            从官方博客、Hacker News、arXiv 等公开来源聚合，按模型 / 产品 / 行业 / 论文 /
            技巧分类，去噪后只留下值得一看的内容。
          </p>
        </div>
        <p className="text-xs text-muted-foreground">仅聚合公开来源，保留原文出处与链接。</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo className="text-lg" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">登录</h1>
          <p className="mt-1 text-sm text-muted-foreground">使用你的账户继续</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                邮箱
              </label>
              <Input
                id="email"
                ref={emailRef}
                type="email"
                autoComplete="username"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                密码
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
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
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
                {authErrorMessage(login.error)}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              variant="accent"
              disabled={login.isPending}
            >
              {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {login.isPending ? '登录中…' : '登录'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
