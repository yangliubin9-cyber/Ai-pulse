import { cn } from '@/lib/cn';

/** Self-authored palette for the generated initial-avatar (cyan-leaning). */
const AVATAR_HUES = [199, 156, 35, 268, 340, 222, 12, 96];

/** Deterministic hue from the source name so each source keeps a stable color. */
function hueFor(name: string): number {
  let acc = 0;
  for (let i = 0; i < name.length; i += 1) acc = (acc * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_HUES[acc % AVATAR_HUES.length];
}

interface SourceAvatarProps {
  name: string;
  className?: string;
}

/**
 * Round avatar built from the source name's first character on a tinted disc.
 * No remote images — purely generated, so it works offline and never 404s.
 */
export function SourceAvatar({
  name,
  className,
}: SourceAvatarProps): React.JSX.Element {
  const initial = (name.trim()[0] ?? '·').toUpperCase();
  const hue = hueFor(name);
  return (
    <span
      className={cn(
        'grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold ring-1 ring-inset ring-black/5 dark:ring-white/10',
        className,
      )}
      style={{
        color: `hsl(${hue} 80% 70%)`,
        backgroundColor: `hsl(${hue} 55% 22% / 0.55)`,
      }}
      aria-hidden
      title={name}
    >
      {initial}
    </span>
  );
}
