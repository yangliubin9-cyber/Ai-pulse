import { describe, it, expect } from 'vitest';
import { splitParagraphs } from './paragraphs';

describe('splitParagraphs', () => {
  it('honours existing blank-line structure and keeps each block intact', () => {
    const text = '第一段中文正文。\n\n第二段中文正文。';
    expect(splitParagraphs(text)).toEqual(['第一段中文正文。', '第二段中文正文。']);
  });

  it('preserves single newlines inside a blank-line-separated block', () => {
    const text = 'line one\nline two\n\nsecond paragraph';
    expect(splitParagraphs(text)).toEqual(['line one\nline two', 'second paragraph']);
  });

  it('leaves a short single block untouched (below the soft-split threshold)', () => {
    const text = '这是一段很短的话。它不应该被切分。';
    expect(splitParagraphs(text)).toEqual([text]);
  });

  it('soft-splits a long unbroken Chinese block at sentence-ending punctuation', () => {
    // One long block, no blank lines, > 120 chars, several Chinese sentences
    // ending in 。 ！ ？ respectively — each becomes its own paragraph.
    const s1 = '人工智能在过去十年里取得了惊人的进展，深度学习成为推动这一浪潮的核心技术。';
    const s2 = '大型语言模型能够理解并生成自然语言，正在改变软件开发与内容创作的方式。';
    const s3 = '与此同时，研究者也在持续关注模型的安全性、可解释性以及对齐问题！';
    const s4 = '未来这些系统会更加普及并真正走进每个人的日常工作与生活吗？';
    const out = splitParagraphs(s1 + s2 + s3 + s4);
    expect(out).toEqual([s1, s2, s3, s4]);
    expect(out.length).toBe(4);
  });

  it('does not break on a decimal point inside a model name or version', () => {
    // Over the 120-char threshold and newline-free, so soft-split runs; but the
    // 5.2 / 1.0 / 3.14 dots must not create sentence boundaries (digit guard) —
    // only the single trailing 。 ends a sentence, so the block stays whole.
    const long =
      '我们今天正式发布了全新的 GPT-5.2 旗舰模型，它在多项公开基准测试中都明显超过了上一代产品的综合表现，' +
      '与此同时我们还把单位推理成本一路降低到了 v1.0 时期的大约三分之一，而像圆周率约等于 3.14 这样的小数也始终不会被误判为句子的结尾。';
    const out = splitParagraphs(long);
    expect(out).toEqual([long]);
    expect(out.every((p) => p.includes('GPT-5.2'))).toBe(true);
  });

  it('breaks an English sentence boundary when the next char is a non-digit', () => {
    const long =
      'This is the first sentence of a fairly long english paragraph that exceeds the threshold. ' +
      'Here comes the second sentence which should be split onto its own line for readability.';
    const out = splitParagraphs(long);
    expect(out.length).toBe(2);
    expect(out[0]).toBe(
      'This is the first sentence of a fairly long english paragraph that exceeds the threshold.',
    );
    expect(out[1]).toBe(
      'Here comes the second sentence which should be split onto its own line for readability.',
    );
  });

  it('keeps a long block whole when it has inner newlines (respects given breaks)', () => {
    const block =
      '这是带有内部换行的长文本，第一行写到这里。\n' +
      '第二行继续写，整体长度超过一百二十个字符的阈值，' +
      '但因为已经有换行结构，所以不再做软切分处理，尊重原有排版与节奏安排。';
    expect(splitParagraphs(block)).toEqual([block]);
  });

  it('returns an empty array for empty or whitespace-only input', () => {
    expect(splitParagraphs('')).toEqual([]);
    expect(splitParagraphs('   \n  \n ')).toEqual([]);
  });

  it('appends a trailing remainder that has no sentence-ending punctuation', () => {
    // The whole block must exceed the 120-char threshold so soft-split runs;
    // the first sentence ends in 。 and the punctuation-free tail follows.
    const head = '这是文章开头的第一句话它写得相当完整并且明确地以句号收尾。';
    const tail =
      '后面紧接着的是一长段完全没有任何结尾标点的补充说明文字它需要足够长才能让整个文本块超过一百二十个字符的阈值' +
      '从而触发软切分逻辑同时这段文字本身没有句末标点所以应当作为尾部残余被单独追加成一个独立的展示段落以覆盖该分支';
    const out = splitParagraphs(head + tail);
    expect(out.length).toBe(2);
    expect(out[0]).toBe(head);
    expect(out[1].startsWith('后面紧接着')).toBe(true);
  });
});
