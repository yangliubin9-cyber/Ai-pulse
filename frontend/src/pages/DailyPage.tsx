import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FeedSection } from '@/components/feed/FeedSection';
import { Input } from '@/components/ui/input';
import { useDaily } from '@/hooks/useCatalog';
import { todayInputValue } from '@/lib/time';

/** AI 日报: featured items aggregated by a chosen day. */
export function DailyPage(): React.JSX.Element {
  const [date, setDate] = useState<string>(todayInputValue());
  const { data, isPending, isError, error, refetch } = useDaily(date);

  return (
    <div>
      <PageHeader
        title="AI 日报"
        description="按天聚合的精选资讯，可选择日期回看。"
        actions={
          <Input
            type="date"
            value={date}
            max={todayInputValue()}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
            aria-label="选择日期"
          />
        }
      />

      <FeedSection
        items={data?.items}
        isPending={isPending}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        grouped={false}
        emptyTitle="这一天没有日报"
        emptyDescription="换一个日期，或回到精选查看最新内容。"
      />
    </div>
  );
}
