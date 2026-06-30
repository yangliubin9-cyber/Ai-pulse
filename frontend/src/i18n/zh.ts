/**
 * Chinese (zh) UI-chrome dictionary. This is the SOURCE OF TRUTH for the
 * translation key type: `TKey` is derived from the shape of this object.
 * `en.ts` MUST mirror this key set exactly (enforced by a test).
 *
 * Only UI chrome lives here — never news content (item title/summary/author).
 */
export const zh = {
  brand: 'AI Pulse',

  nav: {
    groupContent: '内容',
    groupAccess: '接入',
    groupMore: '更多',
    featured: '精选',
    all: '全部 AI 动态',
    saved: '收藏',
    daily: 'AI 日报',
    sources: '来源',
    agent: 'Agent 接入',
    about: '关于',
    changelog: '更新日志',
    feedback: '反馈',
    settings: '设置',
    openNav: '打开导航',
    closeNav: '关闭导航',
    mainNav: '主导航',
    logout: '退出登录',
    accountFallback: '账户',
  },

  theme: {
    label: '主题',
    light: '亮色',
    dark: '暗色',
    system: '跟随系统',
    toggle: '主题切换',
  },

  lang: {
    label: '语言',
    zh: '中',
    en: 'EN',
    switch: '切换语言',
  },

  common: {
    retry: '重试',
    close: '关闭',
    all: '全部',
  },

  pages: {
    featured: {
      title: '精选',
      description: '今天值得一看的 AI 动态，按时间线排列。',
    },
    all: {
      title: '全部 AI 动态',
      description: '不限精选的完整资讯流，可按分类、来源筛选并搜索关键词。',
      allSources: '全部来源',
      sourceFilter: '来源类型筛选',
      unread: '未读',
      markAllRead: '全部标记已读',
    },
    saved: {
      title: '收藏',
      description: '你收藏的资讯，集中在这里慢慢读。',
      empty: '还没有收藏。在卡片或详情页点书签即可收藏。',
    },
    daily: {
      title: 'AI 日报',
      description: '按天聚合的精选资讯，可选择日期回看。',
      pickDate: '选择日期',
      prevDay: '前一天',
      nextDay: '后一天',
      statEvents: '今日事件',
      statSources: '信源',
      statTop: '主要分类',
      groupCount: '{count} 条',
      emptyTitle: '这一天没有日报',
      emptyDescription: '换一个日期，或回到精选查看最新内容。',
      coverKicker: '每日精选 · AI 资讯周刊',
      coverSubtitle: '把这一天的 AI 动态，收敛成一份可一口气读完的清单。',
      volume: 'VOL.{vol}',
      issueCount: '{count} 篇',
      sectionCount: '{count} 篇',
    },
    sources: {
      title: '采集来源',
      description: '当前接入的公开来源及各自的资讯条数。',
      emptyTitle: '暂无来源',
      emptyDescription: '尚未配置任何采集来源。',
      lastFetched: '最近采集 {time}',
      itemCount: '{count} 条',
    },
    notFound: {
      message: '页面不存在或已被移动。',
      back: '返回精选',
    },
    detail: {
      back: '返回',
      breadcrumbFeed: '资讯流',
      breadcrumbCurrent: '详情',
      readingTime: '约 {min} 分钟',
      reasonTitle: '推荐理由',
      bodyTitle: '内容摘要',
      bodyTitleFull: '正文',
      bodySourceNote: '正文转录自原始来源，版权归原作者所有；如需完整体验请点「阅读原文」。',
      noSummary: '该来源仅提供标题，点下方阅读原文查看完整内容。',
      showOriginal: '显示原文',
      showTranslation: '显示译文',
      readOriginal: '阅读原文',
      collectedFrom: '来源：{source} · 采集于 {time}',
      collectedFromNoTime: '来源：{source}',
      notFoundTitle: '没有找到这条资讯',
      notFoundDescription: '它可能已被移除，或链接已失效。',
      backToFeed: '返回资讯流',
    },
    about: {
      title: '关于 AI Pulse',
      description: '一个为自己做的 AI 资讯聚合站。',
      introTitle: '你好',
      intro:
        '我是 AI Pulse 站长。这是我给自己搭的一个小站，每天把 AI 圈的动态聚到一处，省得我到处刷。',
      bullet1: '每天聚合 AI 圈动态，模型、产品、行业、论文、技巧一处看全。',
      bullet2: '用规则（未来接入 AI）帮你筛掉噪声，只留下值得看的几条。',
      bullet3: '完全免费，自用为主，没有广告，也不卖数据。',
      sourcesTitle: '数据来源',
      sources:
        '内容聚合自 RSS 官方博客、Hacker News、arXiv 等公开来源，保留原文出处与链接，点「阅读原文」即可跳转。我们只整理标题与摘要，不转载第三方编辑的精选内容。',
    },
    agent: {
      title: 'Agent 接入',
      description: '把本站的只读资讯接口接进你的程序或 agent。',
      introTitle: '这是什么',
      intro:
        '本站对外提供一组只读的 AI 资讯 API，方便你的脚本、定时任务或 agent 直接取用聚合后的资讯，无需自己重复抓取多个来源。',
      authTitle: '鉴权方式',
      auth:
        '除登录接口外，所有 /api/v1/** 接口都需要登录态。先调用登录接口拿到会话 Cookie，后续请求带上该 Cookie（credentials: include）即可。',
      endpointsTitle: '主要端点',
      endpointList: '列表（支持 category / source_type / q / featured / page 等筛选）',
      endpointDetail: '单条资讯详情',
      endpointCategories: '分类及各自条数',
      endpointSources: '采集来源列表',
      endpointDaily: '某天的日报（date 省略则取最新）',
      exampleTitle: '返回结构示例',
      exampleNote: '以下为 /items 列表接口返回结构的精简示例：',
    },
    feedback: {
      title: '反馈',
      description: '有问题或建议，欢迎告诉我。',
      intro:
        '这个站还在慢慢打磨，如果你发现了 bug、想要某个功能，或者觉得哪条资讯被错分了类，都可以反馈给我。',
      emailTitle: '邮件反馈',
      emailHint: '把问题描述清楚发到下面这个邮箱，我会尽量看：',
      note: '暂时没有接入在线表单，邮件是目前唯一的反馈渠道。',
    },
  },

  category: {
    filter: '分类筛选',
    model: '模型',
    product: '产品',
    industry: '行业',
    paper: '论文',
    technique: '技巧',
    other: '其他',
  },

  sourceType: {
    rss: 'RSS',
    blog: '博客',
    hackernews: 'Hacker News',
    arxiv: 'arXiv',
  },

  card: {
    heat: '热度 {score}',
    openExternal: '在新标签页打开',
    viewDetail: '查看详情',
    original: '原文',
    link: '链接',
    save: '收藏',
    unsave: '取消收藏',
    new: '新',
    reason: '推荐理由',
  },

  search: {
    placeholder: '搜索资讯关键词…',
    label: '搜索资讯',
    clear: '清除搜索',
    noMatchFeatured: '没有匹配“{query}”的精选内容，换个关键词试试。',
    emptyFeatured: '当前分类暂无精选内容，换个分类或稍后再来。',
    noMatchAll: '没有匹配“{query}”的资讯，换个关键词或筛选条件。',
    emptyAll: '换个分类或来源，或稍后手动刷新。',
  },

  pagination: {
    nav: '分页',
    prev: '上一页',
    next: '下一页',
    pageInfo: '第 {page} / {total} 页 · 共 {count} 条',
  },

  feed: {
    emptyTitle: '暂无资讯',
    emptyDescription: '换个分类或来源，或稍后手动刷新。',
    errorTitle: '无法加载资讯',
    errorDescription: '加载失败，请检查网络后重试。',
  },

  time: {
    justNow: '刚刚',
    minutesAgo: '{n}分钟前',
    hoursAgo: '{n}小时前',
    yesterday: '昨天',
    daysAgo: '{n}天前',
    today: '今天',
    unknownDate: '未知日期',
  },

  login: {
    title: '登录',
    subtitle: '使用你的账户继续',
    email: '邮箱',
    password: '密码',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: '输入密码',
    showPassword: '显示密码',
    hidePassword: '隐藏密码',
    submit: '登录',
    submitting: '登录中…',
    valueProp1: '把每天的 AI 动态，',
    valueProp2Prefix: '收敛成一条清晰的',
    valuePropTimeline: '时间线',
    valueProp2Suffix: '。',
    description:
      '从官方博客、Hacker News、arXiv 等公开来源聚合，按模型 / 产品 / 行业 / 论文 / 技巧分类，去噪后只留下值得一看的内容。',
    disclaimer: '仅聚合公开来源，保留原文出处与链接。',
  },

  settings: {
    title: '设置',
    description: '主题、账户安全与数据刷新。',
    themeTitle: '主题',
    themeLabel: '界面外观',
    themeMode: '主题模式',
    refreshTitle: '手动刷新资讯',
    refreshHint: '立即从所有来源拉取最新资讯。',
    refreshLastFetch: '上次采集：{time}。',
    refreshing: '刷新中…',
    refresh: '刷新资讯',
    refreshResult: '抓取 {fetched} 条，新增 {added} 条',
    passwordTitle: '修改密码',
    oldPassword: '当前密码',
    newPassword: '新密码',
    confirmPassword: '确认新密码',
    minHint: '至少 {min} 位',
    minError: '新密码至少 {min} 位',
    mismatch: '两次输入的新密码不一致',
    sameAsOld: '新密码不能与当前密码相同',
    passwordUpdated: '密码已更新',
    updatePassword: '更新密码',
    aboutTitle: '关于',
    version: '版本',
    totalItems: '资讯总量',
    sourceCount: '来源数量',
    timeWindow: '时间窗口',
    windowDays: '近 {days} 天',
    itemUnit: '{count} 条',
    sourceUnit: '{count} 个',
    aboutText:
      '{appName} 仅聚合公开来源（官方 RSS 博客、Hacker News、arXiv）发布的标题与摘要，保留原文出处与链接，不转载第三方编辑的精选内容，不抓取站点数据。',
  },

  errors: {
    AUTH_INVALID_CREDENTIALS: '邮箱或密码错误',
    AUTH_TOO_MANY_ATTEMPTS: '尝试次数过多，请稍后再试',
    AUTH_OLD_PASSWORD_WRONG: '当前密码不正确',
    UNAUTHORIZED: '登录已过期，请重新登录',
    VALIDATION_ERROR: '请求参数有误，请检查后重试',
    INTERNAL_ERROR: '服务器开小差了，请稍后再试',
    requestFailed: '请求失败（{status}）',
    operationFailed: '操作失败，请重试',
    network: '网络异常，请检查连接后重试',
  },
} as const;

/** Recursively widen all string-literal leaves to `string`. */
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

/**
 * Structural shape of the dictionary with leaves widened to `string`. `en` is
 * typed as `Zh` so it must mirror zh's key structure while allowing any string
 * value. The dotted-key TYPE (`TKey`) is still derived from the literal `zh`.
 */
export type Zh = DeepStringify<typeof zh>;
