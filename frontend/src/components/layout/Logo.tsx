import { cn } from '@/lib/cn';

/**
 * Wordmark for AI Pulse. A short ascending tick (the "pulse") set before the
 * name, drawn with currentColor so it adapts to theme. Intentionally a
 * geometric mark, not a generic rounded-blob logo.
 */
export function Logo({ className }: { className?: string }): React.JSX.Element {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold', className)}>
      <svg
        viewBox="0 0 28 16"
        className="h-4 w-7 text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="square"
        strokeLinejoin="miter"
        aria-hidden
      >
        <path d="M0 9 H7 L10 2 L14 14 L18 9 H28" />
      </svg>
      <span className="tracking-tight">
        AI <span className="text-accent">Pulse</span>
      </span>
    </span>
  );
}
