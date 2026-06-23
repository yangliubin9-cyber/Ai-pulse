import { Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useT } from '@/i18n/I18nProvider';

/** Friendly, personal "about" page for the aggregator. */
export function AboutPage(): React.JSX.Element {
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('pages.about.title')} description={t('pages.about.description')} />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('pages.about.introTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>{t('pages.about.intro')}</p>
            <ul className="space-y-2">
              {(['bullet1', 'bullet2', 'bullet3'] as const).map((k) => (
                <li key={k} className="flex gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <span>{t(`pages.about.${k}`)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('pages.about.sourcesTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            {t('pages.about.sources')}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
