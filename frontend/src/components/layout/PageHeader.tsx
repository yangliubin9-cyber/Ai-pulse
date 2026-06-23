interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/** Consistent page heading block used across feed pages. */
export function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps): React.JSX.Element {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
