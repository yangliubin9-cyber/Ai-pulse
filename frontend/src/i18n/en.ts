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
      introTitle: 'Hi there',
      intro:
        "I'm the AI Pulse maintainer. This is a little site I put together for myself — it pulls the day's AI news into one place so I don't have to hop between feeds.",
      bullet1:
        'Aggregates AI news daily — models, products, industry, papers and techniques, all in one view.',
      bullet2:
        'Uses rules (and, in time, AI) to filter out the noise and keep only the few worth reading.',
      bullet3: 'Completely free, mostly for my own use, no ads and no data selling.',
      sourcesTitle: 'Data sources',
      sources:
        'Content is aggregated from public sources like official RSS blogs, Hacker News and arXiv, keeping the original attribution and links — just hit "Read original" to jump there. We only organize titles and summaries and never republish third-party editorial picks.',
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
    changelog: {
      title: 'Changelog',
      description: 'The main changes this site has been through.',
      v010Title: 'v0.1.0 · First release',
      v010Date: 'Early 2026',
      v010l1: 'Multi-source aggregation from official RSS blogs, Hacker News and arXiv.',
      v010l2: 'Card-stream home page and login guard.',
      v011Title: 'v0.1.1 · Polish',
      v011Date: 'Recently',
      v011l1: 'Dark UI theme and a timeline-style feed.',
      v011l2: 'Heat badges, keyword search and category / source filters.',
      v011l3: 'Bilingual (Chinese / English) internationalization.',
      v011l4: 'In-site article detail page — read items without leaving the site.',
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
