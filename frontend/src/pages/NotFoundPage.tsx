import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/I18nProvider';

export function NotFoundPage(): React.JSX.Element {
  const t = useT();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-5xl font-semibold tabular-nums text-muted-foreground">404</p>
      <p className="text-sm text-muted-foreground">{t('pages.notFound.message')}</p>
      <Button asChild variant="outline">
        <Link to="/">{t('pages.notFound.back')}</Link>
      </Button>
    </div>
  );
}
