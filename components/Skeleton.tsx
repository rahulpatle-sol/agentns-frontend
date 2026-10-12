export function SkeletonLine({ height = 12, className }: { height?: number; className?: string }) {
  return <div className={`skeleton ${className ?? ''}`} style={{ height }} />;
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return <div className={`skeleton h-10 w-10 !rounded-full ${className ?? ''}`} />;
}

export function SkeletonTextLine({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} height={14} className={i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ rows = 2, cols = 3 }: { rows?: number; cols?: number } = {}) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: rows * cols }).map((_, i) => (
        <SkeletonLine key={i} height={56} />
      ))}
    </div>
  );
}
