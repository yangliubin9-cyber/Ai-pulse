import { Rss, MessagesSquare, FileText, Newspaper, Globe } from 'lucide-react';
import type { SourceType } from '@/lib/types';

interface SourceIconProps {
  type: SourceType;
  className?: string;
}

/** Maps a source type to a representative lucide icon. */
export function SourceIcon({ type, className }: SourceIconProps): React.JSX.Element {
  switch (type) {
    case 'rss':
      return <Rss className={className} aria-hidden />;
    case 'hackernews':
      return <MessagesSquare className={className} aria-hidden />;
    case 'arxiv':
      return <FileText className={className} aria-hidden />;
    case 'blog':
      return <Newspaper className={className} aria-hidden />;
    default:
      return <Globe className={className} aria-hidden />;
  }
}
