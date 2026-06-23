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
import { useChangePassword } from '@/hooks/useAuth';
import { useIngestRun } from '@/hooks/useIngest';
import { useStats } from '@/hooks/useCatalog';
import { config } from '@/lib/config';
import { relativeTime } from '@/lib/time';
import { useI18n, useT, type TFn } from '@/i18n/I18nProvider';
import { getErrorMessage } from '@/i18n/errors';
import type { TKey } from '@/i18n';

const MIN_PASSWORD = 8;

const THEME_KEYS: Record<ThemeMode, TKey> = {
  light: 'theme.light',
  dark: 'theme.dark',
  system: 'theme.system',
};

/** Settings: theme, account security, manual ingest, and about. */
export function SettingsPage(): React.JSX.Element {
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('settings.title')} description={t('settings.description')} />
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
  const t = useT();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.themeTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{t('settings.themeLabel')}</span>
        <div className="w-40">
          <Select value={mode} onValueChange={(v) => setMode(v as ThemeMode)}>
            <SelectTrigger aria-label={t('settings.themeMode')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(THEME_KEYS) as ThemeMode[]).map((m) => (
                <SelectItem key={m} value={m}>
                  {t(THEME_KEYS[m])}
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
  const { lang, t } = useI18n();
  const ingest = useIngestRun();
  const { data: stats } = useStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.refreshTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t('settings.refreshHint')}
          {stats?.last_fetch_at && (
            <span>
              {' '}
              {t('settings.refreshLastFetch', {
                time: relativeTime(stats.last_fetch_at, lang),
              })}
            </span>
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
            {ingest.isPending ? t('settings.refreshing') : t('settings.refresh')}
          </Button>
          {ingest.isSuccess && (
            <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 text-cat-product" />
              {t('settings.refreshResult', {
                fetched: ingest.data.fetched,
                added: ingest.data.new,
              })}
            </span>
          )}
          {ingest.isError && (
            <span className="text-sm text-destructive">
              {getErrorMessage(ingest.error, t)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PasswordSection(): React.JSX.Element {
  const t = useT();
  const changePassword = useChangePassword();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setLocalError(null);

    if (newPassword.length < MIN_PASSWORD) {
      setLocalError(t('settings.minError', { min: MIN_PASSWORD }));
      return;
    }
    if (newPassword !== confirm) {
      setLocalError(t('settings.mismatch'));
      return;
    }
    if (newPassword === oldPassword) {
      setLocalError(t('settings.sameAsOld'));
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
        <CardTitle>{t('settings.passwordTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5">
            <label htmlFor="old-password" className="text-sm font-medium">
              {t('settings.oldPassword')}
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
              {t('settings.newPassword')}
            </label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              {t('settings.minHint', { min: MIN_PASSWORD })}
            </p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              {t('settings.confirmPassword')}
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
              {getErrorMessage(changePassword.error, t)}
            </p>
          )}
          {changePassword.isSuccess && (
            <p className="inline-flex items-center gap-1.5 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 text-cat-product" />
              {t('settings.passwordUpdated')}
            </p>
          )}

          <Button type="submit" disabled={changePassword.isPending}>
            {changePassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('settings.updatePassword')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AboutSection(): React.JSX.Element {
  const t = useT();
  const { data: stats } = useStats();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.aboutTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>{t('settings.version')}</span>
          <span className="tabular-nums text-foreground">v{config.version}</span>
        </div>
        {stats && (
          <>
            <div className="flex justify-between">
              <span>{t('settings.totalItems')}</span>
              <span className="tabular-nums text-foreground">
                {t('settings.itemUnit', { count: stats.total_items })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('settings.sourceCount')}</span>
              <span className="tabular-nums text-foreground">
                {t('settings.sourceUnit', { count: stats.sources })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('settings.timeWindow')}</span>
              <span className="tabular-nums text-foreground">
                {t('settings.windowDays', { days: stats.window_days })}
              </span>
            </div>
          </>
        )}
        <p className="pt-2 leading-relaxed">
          {aboutText(t)}
        </p>
      </CardContent>
    </Card>
  );
}

function aboutText(t: TFn): string {
  return t('settings.aboutText', { appName: config.appName });
}
