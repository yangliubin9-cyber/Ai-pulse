import { useState } from 'react';
import { Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useThemeStore, type ThemeMode } from '@/store/themeStore';
import { useChangePassword, authErrorMessage } from '@/hooks/useAuth';
import { useIngestRun } from '@/hooks/useIngest';
import { useStats } from '@/hooks/useCatalog';
import { config } from '@/lib/config';
import { relativeTime } from '@/lib/time';

const MIN_PASSWORD = 8;

const THEME_LABELS: Record<ThemeMode, string> = {
  light: '亮色',
  dark: '暗色',
  system: '跟随系统',
};

/** Settings: theme, account security, manual ingest, and about. */
export function SettingsPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="设置" description="主题、账户安全与数据刷新。" />
      <div className="space-y-4">
        <ThemeSection />
        <RefreshSection />
        <PasswordSection />
        <AboutSection />
      </div>
    </div>
  );
}

function ThemeSection(): React.JSX.Element {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  return (
    <Card>
      <CardHeader>
        <CardTitle>主题</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">界面外观</span>
        <div className="w-40">
          <Select value={mode} onValueChange={(v) => setMode(v as ThemeMode)}>
            <SelectTrigger aria-label="主题模式">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(THEME_LABELS) as ThemeMode[]).map((m) => (
                <SelectItem key={m} value={m}>
                  {THEME_LABELS[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function RefreshSection(): React.JSX.Element {
  const ingest = useIngestRun();
  const { data: stats } = useStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle>手动刷新资讯</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          立即从所有来源拉取最新资讯。
          {stats?.last_fetch_at && (
            <span> 上次采集：{relativeTime(stats.last_fetch_at)}。</span>
          )}
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="accent"
            onClick={() => ingest.mutate()}
            disabled={ingest.isPending}
          >
            {ingest.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {ingest.isPending ? '刷新中…' : '刷新资讯'}
          </Button>
          {ingest.isSuccess && (
            <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 text-cat-product" />
              抓取 {ingest.data.fetched} 条，新增 {ingest.data.new} 条
            </span>
          )}
          {ingest.isError && (
            <span className="text-sm text-destructive">
              {authErrorMessage(ingest.error)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PasswordSection(): React.JSX.Element {
  const changePassword = useChangePassword();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setLocalError(null);

    if (newPassword.length < MIN_PASSWORD) {
      setLocalError(`新密码至少 ${MIN_PASSWORD} 位`);
      return;
    }
    if (newPassword !== confirm) {
      setLocalError('两次输入的新密码不一致');
      return;
    }
    if (newPassword === oldPassword) {
      setLocalError('新密码不能与当前密码相同');
      return;
    }

    changePassword.mutate(
      { oldPassword, newPassword },
      {
        onSuccess: () => {
          setOldPassword('');
          setNewPassword('');
          setConfirm('');
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>修改密码</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5">
            <label htmlFor="old-password" className="text-sm font-medium">
              当前密码
            </label>
            <Input
              id="old-password"
              type="password"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="text-sm font-medium">
              新密码
            </label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">至少 {MIN_PASSWORD} 位</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              确认新密码
            </label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {localError && (
            <p className="text-sm text-destructive" role="alert">
              {localError}
            </p>
          )}
          {changePassword.isError && (
            <p className="text-sm text-destructive" role="alert">
              {authErrorMessage(changePassword.error)}
            </p>
          )}
          {changePassword.isSuccess && (
            <p className="inline-flex items-center gap-1.5 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 text-cat-product" />
              密码已更新
            </p>
          )}

          <Button type="submit" disabled={changePassword.isPending}>
            {changePassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            更新密码
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AboutSection(): React.JSX.Element {
  const { data: stats } = useStats();
  return (
    <Card>
      <CardHeader>
        <CardTitle>关于</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>版本</span>
          <span className="tabular-nums text-foreground">v{config.version}</span>
        </div>
        {stats && (
          <>
            <div className="flex justify-between">
              <span>资讯总量</span>
              <span className="tabular-nums text-foreground">{stats.total_items} 条</span>
            </div>
            <div className="flex justify-between">
              <span>来源数量</span>
              <span className="tabular-nums text-foreground">{stats.sources} 个</span>
            </div>
            <div className="flex justify-between">
              <span>时间窗口</span>
              <span className="tabular-nums text-foreground">近 {stats.window_days} 天</span>
            </div>
          </>
        )}
        <p className="pt-2 leading-relaxed">
          {config.appName} 仅聚合公开来源（官方 RSS 博客、Hacker News、arXiv）发布的标题与摘要，
          保留原文出处与链接，不转载第三方编辑的精选内容，不抓取站点数据。
        </p>
      </CardContent>
    </Card>
  );
}
