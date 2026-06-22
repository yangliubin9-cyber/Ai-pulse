import { Monitor, Moon, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useThemeStore, type ThemeMode } from '@/store/themeStore';
import { cn } from '@/lib/cn';

const OPTIONS: Array<{ mode: ThemeMode; label: string; icon: typeof Sun }> = [
  { mode: 'light', label: '亮色', icon: Sun },
  { mode: 'dark', label: '暗色', icon: Moon },
  { mode: 'system', label: '跟随系统', icon: Monitor },
];

/** Theme switcher: light / dark / system. */
export function ThemeToggle(): React.JSX.Element {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const Active = OPTIONS.find((o) => o.mode === mode)?.icon ?? Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="切换主题">
          <Active className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map(({ mode: m, label, icon: Icon }) => (
          <DropdownMenuItem
            key={m}
            onClick={() => setMode(m)}
            className={cn(m === mode && 'text-accent')}
          >
            <Icon className="h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
