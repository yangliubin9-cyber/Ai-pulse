import { useI18n } from '@/i18n/I18nProvider';
import type { Lang } from '@/i18n';
import { cn } from '@/lib/cn';

/**
 * Changelog — a date-grouped timeline. Each day shows a heading + divider, then
 * entries laid out as a left rail (time + change-type tag) beside the change
 * (title, description, optional bullet sub-points). Content is held inline and
 * bilingual (picked by UI language) since it is self-contained page copy with a
 * variable, nested shape that flat i18n keys model poorly.
 */

/** A bilingual string — the right side is chosen by the active UI language. */
type Bi = { zh: string; en: string };

type ChangeType = 'feature' | 'improvement';

interface Bullet {
  lead: Bi;
  body: Bi;
}

interface Entry {
  time: string;
  type: ChangeType;
  title: Bi;
  desc?: Bi;
  bullets?: Bullet[];
}

interface Day {
  date: Bi;
  weekday: Bi;
  entries: Entry[];
}

const TYPE_META: Record<ChangeType, { label: Bi; dot: string; text: string }> = {
  feature: { label: { zh: '新功能', en: 'New' }, dot: 'bg-emerald-400', text: 'text-emerald-400' },
  improvement: { label: { zh: '优化', en: 'Improved' }, dot: 'bg-accent', text: 'text-accent' },
};

const HEADER = {
  eyebrow: 'CHANGELOG',
  title: { zh: '更新日志', en: 'Changelog' } as Bi,
  subtitle: {
    zh: '最近发生了什么 — 新功能、调整、优化，都写在这里。',
    en: "What's changed lately — new features, tweaks and refinements, all here.",
  } as Bi,
};

const CHANGELOG: Day[] = [
  {
    date: { zh: '2026 年 6 月 30 日', en: 'June 30, 2026' },
    weekday: { zh: '周二', en: 'Tue' },
    entries: [
      {
        time: '16:20',
        type: 'improvement',
        title: { zh: '「全部 AI 动态」内容优先', en: 'Content-first "All AI News"' },
        desc: {
          zh: '链接型条目（如 Hacker News 纯链接帖）现在自动抓取来源页摘要并译成中文，配上缩略图——卡片从"一排原文链接"变成可读内容。',
          en: 'Link-only items (e.g. Hacker News submissions) now pull the source page’s own summary, translate it to Chinese and add a thumbnail — turning a wall of "original" links into readable cards.',
        },
        bullets: [
          {
            lead: { zh: '一句话摘要', en: 'One-line summary' },
            body: { zh: '无正文的链接帖补上来源页 og 摘要，中文呈现', en: "bare links get the source page’s og:description, shown in Chinese" },
          },
          {
            lead: { zh: '链接卡', en: 'Link card' },
            body: { zh: '少数没有摘要的，显示来源域名做成干净的链接卡', en: 'the few with no metadata show a clean "link · domain" card' },
          },
          {
            lead: { zh: '原文弱化', en: 'Quieter "original"' },
            body: { zh: '每条的"原文"从文字降为角标图标，不再刷屏', en: 'the repeated "original" link is now just a small icon' },
          },
        ],
      },
      {
        time: '15:40',
        type: 'improvement',
        title: { zh: '列表页铺满宽度', en: 'Full-width list pages' },
        desc: {
          zh: '精选 / 全部 AI 动态 / 日报等列表页现在用满整个页面宽度，不再挤在窄栏里。',
          en: 'Feed pages (Featured / All AI News / Daily) now fill the full page width instead of a narrow centered column.',
        },
      },
    ],
  },
  {
    date: { zh: '2026 年 6 月 29 日', en: 'June 29, 2026' },
    weekday: { zh: '周一', en: 'Mon' },
    entries: [
      {
        time: '14:55',
        type: 'improvement',
        title: { zh: '详情页阅读排版精修', en: 'Refined detail-page reading layout' },
        desc: {
          zh: '文章详情页统一了阅读栏宽，标题、分隔线、正文、页脚共享同一边界，读起来更整。',
          en: 'The article page now uses one consistent reading column — title, divider, body and footer share the same edges.',
        },
        bullets: [
          {
            lead: { zh: '统一栏宽', en: 'One column' },
            body: { zh: '标题与正文同宽，"显示原文"不再悬空在外', en: 'title and body share a width; the "show original" toggle no longer floats off' },
          },
          {
            lead: { zh: '署名两层', en: 'Two-tier byline' },
            body: { zh: '来源·时间·热度一行，作者署名单独一行', en: 'source · time · heat on top, author credit on a quieter line below' },
          },
          {
            lead: { zh: '标题平衡换行', en: 'Balanced title' },
            body: { zh: '多行标题左右更匀称', en: 'multi-line titles wrap more evenly' },
          },
        ],
      },
    ],
  },
  {
    date: { zh: '2026 年 6 月 28 日', en: 'June 28, 2026' },
    weekday: { zh: '周日', en: 'Sun' },
    entries: [
      {
        time: '22:10',
        type: 'improvement',
        title: { zh: '中文标点全角化', en: 'Full-width Chinese punctuation' },
        desc: {
          zh: '机翻中文里夹杂的英文半角标点（. , :）自动转成全角（。，：），数字和网址不动，读起来清爽。',
          en: 'Half-width ASCII punctuation (. , :) wedged inside machine-translated Chinese is now converted to full-width (。，：), leaving numbers and URLs untouched.',
        },
      },
      {
        time: '21:30',
        type: 'improvement',
        title: { zh: '全站视觉精修', en: 'Site-wide visual polish' },
        desc: {
          zh: '卡片、侧边栏、头部、徽章、状态做了一轮整体精修。',
          en: 'A full pass of visual polish across cards, sidebar, header, badges and states.',
        },
        bullets: [
          {
            lead: { zh: '热度青色胶囊', en: 'Cyan heat pill' },
            body: { zh: '热度徽章改成青色实心胶囊', en: 'the heat badge became a solid cyan pill' },
          },
          {
            lead: { zh: '卡片层次', en: 'Card depth' },
            body: { zh: '描边、悬停、缩略图更精致', en: 'crisper borders, hover states and thumbnails' },
          },
          {
            lead: { zh: '暗 / 亮双主题', en: 'Dark & light' },
            body: { zh: '两套主题都重新调过', en: 'both themes retuned' },
          },
        ],
      },
    ],
  },
  {
    date: { zh: '2026 年 6 月 13 日', en: 'June 13, 2026' },
    weekday: { zh: '周六', en: 'Sat' },
    entries: [
      {
        time: '09:00',
        type: 'feature',
        title: { zh: '初版上线', en: 'First release' },
        desc: {
          zh: '多源 AI 资讯聚合站的第一版。',
          en: 'The first version of the multi-source AI news aggregator.',
        },
        bullets: [
          {
            lead: { zh: '多源采集', en: 'Multi-source' },
            body: { zh: 'RSS 官方博客 + Hacker News + arXiv', en: 'official RSS blogs + Hacker News + arXiv' },
          },
          {
            lead: { zh: '卡片流 + 登录', en: 'Feed + login' },
            body: { zh: '时间轴资讯流与登录守卫', en: 'a timeline feed and a login guard' },
          },
          {
            lead: { zh: '中文翻译', en: 'Chinese translation' },
            body: { zh: '英文资讯离线翻成中文', en: 'English items translated offline to Chinese' },
          },
          {
            lead: { zh: '站内详情页', en: 'In-site detail' },
            body: { zh: '点卡片在站内读中文', en: 'click a card to read it in-site' },
          },
        ],
      },
    ],
  },
];

const pick = (bi: Bi, lang: Lang): string => bi[lang];

export function ChangelogPage(): React.JSX.Element {
  const { lang } = useI18n();
  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        {HEADER.eyebrow}
      </p>
      <h1 className="mt-3 text-[28px] font-bold tracking-tight sm:text-[34px]">
        {pick(HEADER.title, lang)}
      </h1>
      <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-muted-foreground">
        {pick(HEADER.subtitle, lang)}
      </p>

      {/* Timeline of day groups */}
      <div className="mt-12 space-y-14">
        {CHANGELOG.map((day) => (
          <section key={day.date.en}>
            <div className="flex items-baseline gap-3 border-b border-border pb-3">
              <h2 className="text-xl font-bold tracking-tight sm:text-[22px]">
                {pick(day.date, lang)}
              </h2>
              <span className="text-sm text-muted-foreground">{pick(day.weekday, lang)}</span>
            </div>

            <div className="mt-6 space-y-9">
              {day.entries.map((entry) => (
                <Row key={`${day.date.en}-${entry.time}-${entry.title.en}`} entry={entry} lang={lang} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Row({ entry, lang }: { entry: Entry; lang: Lang }): React.JSX.Element {
  const type = TYPE_META[entry.type];
  return (
    <article className="sm:flex sm:gap-8">
      {/* Left rail: time + change-type tag */}
      <div className="flex items-center gap-3 sm:w-28 sm:shrink-0 sm:flex-col sm:items-start sm:gap-1.5">
        <span className="text-sm font-medium tabular-nums text-muted-foreground">{entry.time}</span>
        <span className="inline-flex items-center gap-1.5">
          <span className={cn('h-1.5 w-1.5 rounded-full', type.dot)} aria-hidden />
          <span className={cn('text-xs font-medium', type.text)}>{pick(type.label, lang)}</span>
        </span>
      </div>

      {/* Change: title + description + bullet sub-points */}
      <div className="mt-2.5 min-w-0 flex-1 sm:mt-0">
        <h3 className="text-[15px] font-semibold leading-snug tracking-tight">
          {pick(entry.title, lang)}
        </h3>
        {entry.desc && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {pick(entry.desc, lang)}
          </p>
        )}
        {entry.bullets && (
          <ul className="mt-3 space-y-2">
            {entry.bullets.map((b) => (
              <li
                key={b.lead.en}
                className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
              >
                <span
                  className="mt-[0.5rem] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50"
                  aria-hidden
                />
                <span>
                  <span className="font-medium text-foreground">{pick(b.lead, lang)}</span>
                  {lang === 'zh' ? '：' : ': '}
                  {pick(b.body, lang)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
