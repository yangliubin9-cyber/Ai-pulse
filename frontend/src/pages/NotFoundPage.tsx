import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage(): React.JSX.Element {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-5xl font-semibold tabular-nums text-muted-foreground">404</p>
      <p className="text-sm text-muted-foreground">页面不存在或已被移动。</p>
      <Button asChild variant="outline">
        <Link to="/">返回精选</Link>
      </Button>
    </div>
  );
}
