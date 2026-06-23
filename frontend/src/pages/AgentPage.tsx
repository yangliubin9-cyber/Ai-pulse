import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useT } from '@/i18n/I18nProvider';

/** Endpoint rows shown in the "main endpoints" table. */
const ENDPOINTS: ReadonlyArray<{ method: string; path: string; descKey: string }> = [
  { method: 'GET', path: '/api/v1/items', descKey: 'pages.agent.endpointList' },
  { method: 'GET', path: '/api/v1/items/{id}', descKey: 'pages.agent.endpointDetail' },
  { method: 'GET', path: '/api/v1/categories', descKey: 'pages.agent.endpointCategories' },
  { method: 'GET', path: '/api/v1/sources', descKey: 'pages.agent.endpointSources' },
  { method: 'GET', path: '/api/v1/daily?date=', descKey: 'pages.agent.endpointDaily' },
] as const;

/** Self-authored example response for the /items list endpoint. */
const ITEMS_EXAMPLE = `{
  "items": [
    {
      "id": "itm_8f21",
      "source_type": "rss",
      "source_name": "OpenAI Blog",
      "title": "Example model release notes",
      "title_zh": "示例模型发布说明",
      "url": "https://example.com/blog/release",
      "summary": "A short abstract of the post …",
      "summary_zh": "该帖子的简短摘要 …",
      "author": "openai",
      "category": "model",
      "tags": ["llm", "release"],
      "image_url": null,
      "score": 128,
      "published_at": "2026-06-22T10:00:00Z"
    }
  ],
  "total": 194,
  "page": 1,
  "page_size": 20
}`;

/** Static documentation page describing the read-only news API for agents. */
export function AgentPage(): React.JSX.Element {
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('pages.agent.title')} description={t('pages.agent.description')} />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('pages.agent.introTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            {t('pages.agent.intro')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('pages.agent.authTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            {t('pages.agent.auth')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('pages.agent.endpointsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {ENDPOINTS.map((ep) => (
                <li key={ep.path} className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0">
                  <code className="font-mono text-xs text-foreground">
                    <span className="mr-2 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                      {ep.method}
                    </span>
                    {ep.path}
                  </code>
                  <span className="text-xs text-muted-foreground">
                    {t(ep.descKey as Parameters<typeof t>[0])}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('pages.agent.exampleTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('pages.agent.exampleNote')}</p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-surface-muted p-3 font-mono text-xs leading-relaxed text-foreground/90">
              <code>{ITEMS_EXAMPLE}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
