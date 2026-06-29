/**
 * Display-layer paragraph splitting for long article bodies. Pure, no React.
 *
 * Machine-translated bodies (arXiv abstracts, full MarkTechPost transcriptions)
 * frequently arrive as one wall of text: sentences end with `。` / `.` but the
 * source carries no blank lines, so a naive blank-line split renders the whole
 * article as a single dense block. This module splits such text into readable
 * paragraphs *for display only* — it never mutates the stored content.
 *
 * Strategy, in order of precedence:
 *  1. Honour existing structure. If the text already has blank-line breaks
 *     (`\n\n`), trust the author/source and split on those, keeping any
 *     single newlines inside a block intact (the caller renders with
 *     `whitespace-pre-wrap`).
 *  2. Soft-split only the long, unbroken blocks. A block is left untouched when
 *     it is short (<= SOFT_SPLIT_THRESHOLD characters) or already contains a
 *     newline; otherwise it is broken at sentence-ending punctuation.
 *
 * Sentence boundary rule (deliberately simple, to avoid a dependency): break
 * *after* a run of sentence-ending punctuation (Chinese `。！？` or ASCII
 * `.!?`) plus any closing quotes/brackets that follow it — but only when the
 * next non-space character is NOT a digit. The digit guard stops false breaks
 * inside `GPT-5.2`, `v1.0`, `3.14`, etc.: a candidate boundary that the guard
 * rejects is simply absorbed into the current sentence, which then continues.
 */

/** Blocks at or below this length are never soft-split. */
const SOFT_SPLIT_THRESHOLD = 120;

/** Sentence-ending punctuation marks (Chinese full-width + ASCII). */
const END_PUNCT = new Set(['。', '！', '？', '.', '!', '?']);
/** Closing marks kept with the sentence they close (quotes, brackets). */
const CLOSERS = new Set(['"', "'", '”', '’', '）', '】', '」', '』', ')', ']']);

/**
 * Soft-split a single newline-free block at sentence-ending punctuation, using a
 * left-to-right scanner. Each returned element keeps its trailing punctuation;
 * a boundary is only honoured when the following non-space char is a non-digit
 * (so decimals / version numbers stay intact). Any punctuation-free remainder is
 * returned as its own paragraph.
 */
function softSplitBlock(block: string): string[] {
  const sentences: string[] = [];
  let start = 0;
  let i = 0;
  const n = block.length;

  while (i < n) {
    if (!END_PUNCT.has(block[i])) {
      i += 1;
      continue;
    }
    // Consume the full run of end punctuation, then any closing marks.
    let end = i + 1;
    while (end < n && END_PUNCT.has(block[end])) end += 1;
    while (end < n && CLOSERS.has(block[end])) end += 1;

    // Look at the next non-space character: a digit means this is a decimal /
    // version dot, not a sentence end — keep scanning within the same sentence.
    let j = end;
    while (j < n && /\s/.test(block[j])) j += 1;
    const nextIsDigit = j < n && block[j] >= '0' && block[j] <= '9';

    if (nextIsDigit) {
      i = end;
      continue;
    }

    const sentence = block.slice(start, end).trim();
    if (sentence.length > 0) sentences.push(sentence);
    start = end;
    i = end;
  }

  // Trailing remainder with no sentence-ending punctuation.
  const tail = block.slice(start).trim();
  if (tail.length > 0) sentences.push(tail);

  // If nothing useful came out (no boundaries found), keep the block whole.
  return sentences.length > 0 ? sentences : [block.trim()];
}

/**
 * Split article body text into display paragraphs.
 *
 * - Existing blank-line structure wins: `\n\n` separates paragraphs and inner
 *   single newlines are preserved within each.
 * - A block with no inner newline that exceeds {@link SOFT_SPLIT_THRESHOLD}
 *   characters is soft-split at sentence boundaries (see module docs).
 * - Short blocks and blocks that already contain newlines are returned as-is.
 *
 * The result is always a non-empty array for non-empty input; empty/whitespace
 * input yields an empty array.
 */
export function splitParagraphs(text: string): string[] {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  const result: string[] = [];
  for (const block of blocks) {
    const longEnough = block.length > SOFT_SPLIT_THRESHOLD;
    const hasInnerNewline = block.includes('\n');
    if (longEnough && !hasInnerNewline) {
      result.push(...softSplitBlock(block));
    } else {
      result.push(block);
    }
  }
  return result;
}
