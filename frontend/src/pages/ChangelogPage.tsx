import { PageHeader } from '@/components/layout/PageHeader';
import { useT, type TFn } from '@/i18n/I18nProvider';
import type { TKey } from '@/i18n';

interface Release {
  titleKey: TKey;
  dateKey: TKey;
  entryKeys: TKey[];
}

const RELEASES: Release[] = [
  {
    titleKey: 'pages.changelog.v011Title',
    dateKey: 'pages.changelog.v011Date',
    entryKeys: [
      'pages.changelog.v011l1',
      'pages.changelog.v011l2',
      'pages.changelog.v011l3',
      'pages.changelog.v011l4',
    ],
  },
  {
    titleKey: 'pages.changelog.v010Title',
    dateKey: 'pages.changelog.v010Date',
    entryKeys: ['pages.changelog.v010l1', 'pages.changelog.v010l2'],
  },
];

/** Changelog: a small, timeline-style list of real version entries. */
export function ChangelogPage(): React.JSX.Element {
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t('pages.changelog.title')}
        description={t('pages.changelog.description')}
      />
      <ol className="space-y-6">
        {RELEASES.map((release) => (
          <ReleaseBlock key={release.titleKey} release={release} t={t} />
        ))}
      </ol>
    </div>
  );
}

function ReleaseBlock({ release, t }: { release: Release; t: TFn }): React.JSX.Element {
  return (
    <li className="relative border-l border-border pl-5">
      <span
        className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-accent bg-background"
        aria-hidden
      />
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2 className="text-base font-semibold tracking-tight">{t(release.titleKey)}</h2>
        <span className="text-xs text-muted-foreground">{t(release.dateKey)}</span>
      </div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
        {release.entryKeys.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
    </li>
  );
}
