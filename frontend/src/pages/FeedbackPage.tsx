import { Mail } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useT } from '@/i18n/I18nProvider';

/** Placeholder feedback address — no real form backend is wired up. */
const FEEDBACK_EMAIL = 'feedback@ai-pulse.local';

/** Static feedback page: explains how to reach out (no form backend). */
export function FeedbackPage(): React.JSX.Element {
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t('pages.feedback.title')}
        description={t('pages.feedback.description')}
      />
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-4 text-sm leading-relaxed text-muted-foreground">
            {t('pages.feedback.intro')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('pages.feedback.emailTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>{t('pages.feedback.emailHint')}</p>
            <a
              href={`mailto:${FEEDBACK_EMAIL}`}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground hover:border-accent/40 hover:text-accent"
            >
              <Mail className="h-4 w-4" aria-hidden />
              {FEEDBACK_EMAIL}
            </a>
            <p className="text-xs">{t('pages.feedback.note')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
