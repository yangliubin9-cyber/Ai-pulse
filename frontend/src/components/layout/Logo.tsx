import { cn } from '@/lib/cn';

/**
 * Wordmark for AI Pulse. A self-drawn geometric mark: a rounded square tile
 * with a rising pulse stroke, set before the name. currentColor on the stroke
 * so it adapts to theme. Intentionally not a generic rounded-blob logo and not
 * copied from any reference site.
 */
export function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}): React.JSX.Element {
  return (
    <span className={cn('inline-flex items-center gap-2.5 font-semibold', className)}>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent/15 ring-1 ring-inset ring-accent/30">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 text-accent"
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
      {showText && (
        <span className="tracking-tight">
          AI <span className="text-accent">Pulse</span>
        </span>
      )}
    </span>
  );
}
