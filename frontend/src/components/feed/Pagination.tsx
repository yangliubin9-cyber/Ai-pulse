import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/I18nProvider';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

/** Simple prev/next pager with page indicator. */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps): React.JSX.Element | null {
  const t = useT();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-between gap-4 py-4"
      aria-label={t('pagination.nav')}
      data-testid="pagination"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        {t('pagination.prev')}
      </Button>
      <span className="text-xs tabular-nums text-muted-foreground">
        {t('pagination.pageInfo', { page, total: totalPages, count: total })}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        {t('pagination.next')}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
