import { Fragment } from 'react';

/**
 * Minimal, dependency-free inline-markdown renderer for editorial notes.
 *
 * Supports only `**bold**` emphasis; everything else is rendered verbatim as
 * plain text. There is no HTML parsing and no `dangerouslySetInnerHTML`, so the
 * text can never inject markup — the only nodes produced are React `<strong>`
 * elements and plain strings, making this safe against XSS by construction.
 *
 * Blank-line-separated blocks become separate lines; single newlines inside a
 * block are preserved via the caller's `whitespace-pre-wrap`.
 */

/** Split a single line into plain-text and bold segments on `**...**` pairs. */
function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Match a `**...**` run (non-greedy, must have content between the markers).
  const pattern = /\*\*([^*]+(?:\*(?!\*)[^*]*)*)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(
      <strong key={`b${key++}`} className="font-semibold text-foreground">
        {match[1]}
      </strong>,
    );
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

interface InlineMarkdownProps {
  text: string;
  className?: string;
}

/**
 * Render `text` with inline `**bold**` support. Paragraph blocks (separated by a
 * blank line) are rendered as `<p>`; lines within a block keep their newlines.
 */
export function InlineMarkdown({ text, className }: InlineMarkdownProps): React.JSX.Element {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  const paragraphs = blocks.length > 0 ? blocks : [text];

  return (
    <div className={className} data-testid="inline-markdown">
      {paragraphs.map((block, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {renderInline(block).map((node, j) => (
            <Fragment key={j}>{node}</Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}
