import * as React from 'react';
import { cn } from '@/lib/cn';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn('animate-pulse rounded-sm bg-surface-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
