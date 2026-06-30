import type { Zh } from './zh';

/**
 * English (en) UI-chrome dictionary. MUST mirror the key set of `zh.ts`
 * exactly — enforced by the key-alignment test. Typed as `Zh` so any missing
 * or extra key is a compile error.
 */
export const en: Zh = {
  brand: 'AI Pulse',

  nav: {
    groupContent: 'Content',
    groupAccess: 'Access',
    groupMore: 'More',
    featured: 'Featured',
    all: 'All AI News',
    saved: 'Saved',
    daily: 'AI Daily',
    sources: 'Sources',
    agent: 'Agent API',
    about: 'About',
    changelog: 'Changelog',
    feedback: 'Feedback',
    settings: 'Settings',
    openNav: 'Open navigation',
    closeNav: 'Close navigation',
    mainNav: 'Main navigation',
    logout: 'Sign out',
    accountFallback: 'Account',
  },

  theme: {
    label: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    toggle: 'Switch theme',
  },

  lang: {
    label: 'Language',
    zh: '中',
    en: 'EN',
    switch: 'Switch language',
  },

  common: {
    retry: 'Retry',
    close: 'Close',
    all: 'All',
  },

  pages: {
    featured: {
      title: 'Featured',
      description: "Today's AI stories worth a look, arranged as a timeline.",
    },
    all: {
      title: 'All AI News',
      description:
        'The complete feed beyond featured — filter by category and source, or search by keyword.',
      allSources: 'All sources',
      sourceFilter: 'Filter by source type',
      unread: 'Unread',
      markAllRead: 'Mark all read',
    },
    saved: {
      title: 'Saved',
      description: 'The items you bookmarked, gathered here to read at your pace.',
      empty: 'Nothing saved yet. Tap the bookmark on a card or detail page to save it.',
    },
    daily: {
      title: 'AI Daily',
      description: 'Featured news aggregated by day; pick a date to look back.',
      pickDate: 'Pick a date',
      prevDay: 'Previous day',
      nextDay: 'Next day',
      statEvents: 'Events today',
      statSources: 'Sources',
      statTop: 'Top category',
      groupCount: '{count} items',
      emptyTitle: 'No daily for this day',
      emptyDescription: 'Try another date, or return to Featured for the latest.',
      coverKicker: 'Daily Picks · AI News Weekly',
      coverSubtitle: "The day's AI moves, distilled into a list you can read in one sitting.",
      volume: 'VOL.{vol}',
      issueCount: '{count} stories',
      sectionCount: '{count} stories',
    },
    sources: {
      title: 'Sources',
      description: 'Connected public sources and the item count of each.',
      emptyTitle: 'No sources',
      emptyDescription: 'No collection sources have been configured yet.',
      lastFetched: 'Last fetched {time}',
      itemCount: '{count} items',
    },
    notFound: {
      message: 'This page does not exist or has been moved.',
      back: 'Back to Featured',
    },
    detail: {
      back: 'Back',
      breadcrumbFeed: 'Feed',
      breadcrumbCurrent: 'Detail',
      readingTime: 'About {min} min read',
      reasonTitle: 'Why this matters',
      bodyTitle: 'Summary',
      bodyTitleFull: 'Article',
      bodySourceNote:
        'Body text is transcribed from the original source; copyright belongs to the original author. For the full experience, use "Read original".',
      noSummary:
        'This source only provides a title — open the original below to read the full piece.',
      showOriginal: 'Show original',
      showTranslation: 'Show translation',
      readOriginal: 'Read original',
      collectedFrom: 'Source: {source} · collected {time}',
      collectedFromNoTime: 'Source: {source}',
      notFoundTitle: 'This story was not found',
      notFoundDescription: 'It may have been removed, or the link is no longer valid.',
      backToFeed: 'Back to the feed',
    },
    about: {
      title: 'About AI Pulse',
      description: 'An AI news aggregator I built for myself.',
      eyebrow: 'ABOUT',
      greeting: "Hi, I'm",
      tagline: 'I built this site, and it’s free for everyone.',
      line1: 'Catch what’s new in AI every day.',
      line2: 'Let rules filter out the noise (AI in time).',
      line3: 'Keep only the few worth reading.',
      attribution1:
        'AI Pulse is an aggregated digest and reading index; copyright stays with each source — it keeps only titles and summaries with attribution and links, and never reposts third-party editorial picks.',
      attribution2:
        'If you’re a source and want a correction, removal or display change, reach me via the feedback page.',
      joinTitle: 'Found it useful? Add me',
      wechatLabel: 'WeChat',
      wechatCaption: 'Scan to add me — let’s talk AI',
      footer: 'A small project made with care · since 2026',
    },
    agent: {
      title: 'Agent API',
      description: "Wire this site's read-only news API into your program or agent.",
      introTitle: 'What is this',
      intro:
        'The site exposes a set of read-only AI news APIs so your scripts, cron jobs or agents can consume the aggregated feed directly, without re-scraping every source themselves.',
      authTitle: 'Authentication',
      auth:
        'Every /api/v1/** endpoint except login requires a session. Call the login endpoint to obtain a session cookie, then send it with each request (credentials: include).',
      endpointsTitle: 'Main endpoints',
      endpointList: 'List (filter by category / source_type / q / featured / page …)',
      endpointDetail: 'A single news item',
      endpointCategories: 'Categories with per-category counts',
      endpointSources: 'List of collection sources',
      endpointDaily: 'The daily for a given day (omit date for the latest)',
      exampleTitle: 'Response shape example',
      exampleNote: 'A trimmed example of the /items list response shape:',
    },
    feedback: {
      title: 'Feedback',
      description: 'Found a problem or have an idea? Let me know.',
      intro:
        "This site is still being polished. If you hit a bug, want a feature, or think a story landed in the wrong category, I'd love to hear it.",
      emailTitle: 'Email feedback',
      emailHint: 'Describe the issue and send it to the address below; I read what I can:',
      note: "There's no online form yet — email is the only feedback channel for now.",
    },
  },

  category: {
    filter: 'Filter by category',
    model: 'Models',
    product: 'Products',
    industry: 'Industry',
    paper: 'Papers',
    technique: 'Techniques',
    other: 'Other',
  },

  sourceType: {
    rss: 'RSS',
    blog: 'Blog',
    hackernews: 'Hacker News',
    arxiv: 'arXiv',
  },

  card: {
    heat: 'Heat {score}',
    openExternal: 'Open in a new tab',
    viewDetail: 'View detail',
    original: 'Original',
    link: 'Link',
    save: 'Save',
    unsave: 'Unsave',
    new: 'New',
    reason: 'Why this matters',
  },

  search: {
    placeholder: 'Search news keywords…',
    label: 'Search news',
    clear: 'Clear search',
    noMatchFeatured:
      'No featured content matches “{query}”. Try a different keyword.',
    emptyFeatured:
      'No featured content in this category right now — try another category or check back later.',
    noMatchAll:
      'No news matches “{query}”. Try a different keyword or filter.',
    emptyAll: 'Try another category or source, or refresh manually later.',
  },

  pagination: {
    nav: 'Pagination',
    prev: 'Previous',
    next: 'Next',
    pageInfo: 'Page {page} / {total} · {count} items',
  },

  feed: {
    emptyTitle: 'No news yet',
    emptyDescription: 'Try another category or source, or refresh manually later.',
    errorTitle: 'Unable to load news',
    errorDescription: 'Loading failed. Check your connection and try again.',
  },

  time: {
    justNow: 'Just now',
    minutesAgo: '{n}m ago',
    hoursAgo: '{n}h ago',
    yesterday: 'Yesterday',
    daysAgo: '{n} days ago',
    today: 'Today',
    unknownDate: 'Unknown date',
  },

  login: {
    title: 'Sign in',
    subtitle: 'Continue with your account',
    email: 'Email',
    password: 'Password',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'Enter your password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    submit: 'Sign in',
    submitting: 'Signing in…',
    valueProp1: 'Distill the daily flood of AI news',
    valueProp2Prefix: 'into one clear ',
    valuePropTimeline: 'timeline',
    valueProp2Suffix: '.',
    description:
      'Aggregated from public sources like official blogs, Hacker News and arXiv, sorted into Models / Products / Industry / Papers / Techniques, denoised down to what is worth reading.',
    disclaimer: 'Aggregates public sources only, keeping the original attribution and links.',
    noAccount: 'No account?',
    registerLink: 'Sign up',
  },
  register: {
    subtitle: 'Create your account to get started',
    passwordHint: 'At least 8 characters',
    confirmPassword: 'Confirm password',
    confirmPlaceholder: 'Re-enter your password',
    submit: 'Create account',
    submitting: 'Creating…',
    passwordMismatch: 'The two passwords do not match',
    emailExists: 'This email is already registered',
    haveAccount: 'Already have an account?',
    loginLink: 'Sign in',
  },

  settings: {
    title: 'Settings',
    description: 'Theme, account security and data refresh.',
    themeTitle: 'Theme',
    themeLabel: 'Appearance',
    themeMode: 'Theme mode',
    refreshTitle: 'Refresh news manually',
    refreshHint: 'Pull the latest news from all sources right now.',
    refreshLastFetch: 'Last fetched: {time}.',
    refreshing: 'Refreshing…',
    refresh: 'Refresh news',
    refreshResult: 'Fetched {fetched}, {added} new',
    passwordTitle: 'Change password',
    oldPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    minHint: 'At least {min} characters',
    minError: 'New password must be at least {min} characters',
    mismatch: 'The two new passwords do not match',
    sameAsOld: 'The new password must differ from the current one',
    passwordUpdated: 'Password updated',
    updatePassword: 'Update password',
    aboutTitle: 'About',
    version: 'Version',
    totalItems: 'Total items',
    sourceCount: 'Sources',
    timeWindow: 'Time window',
    windowDays: 'Last {days} days',
    itemUnit: '{count} items',
    sourceUnit: '{count} sources',
    aboutText:
      '{appName} aggregates only the titles and summaries published by public sources (official RSS blogs, Hacker News, arXiv), keeps the original attribution and links, does not republish third-party editorial picks, and does not scrape site data.',
  },

  errors: {
    AUTH_INVALID_CREDENTIALS: 'Incorrect email or password',
    AUTH_TOO_MANY_ATTEMPTS: 'Too many attempts, please try again later',
    AUTH_OLD_PASSWORD_WRONG: 'Current password is incorrect',
    UNAUTHORIZED: 'Your session has expired, please sign in again',
    VALIDATION_ERROR: 'The request is invalid, please check and try again',
    INTERNAL_ERROR: 'Something went wrong on the server, please try again later',
    requestFailed: 'Request failed ({status})',
    operationFailed: 'Operation failed, please try again',
    network: 'Network error, please check your connection and retry',
  },
};
