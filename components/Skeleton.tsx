export function SkeletonLine({
  height = 12,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={`bg-surface/50 rounded ${className ?? ''}`}
      style={{ animation: 'shimmer 2s ease-in-out infinite', height }}
    />
  );
}

export function SkeletonAvatar() {
  return (
    <div className="w-10 h-10 bg-surface/50 rounded-full animate-pulse" />
  );
}

export function SkeletonTextLine(lines: number = 1, className?: string) {
  const lineHeight = 16;
  return (
    <div
      className={`bg-surface/50 rounded h-[${lineHeight}px] w-full ${className}`}
      style={{ animation: 'shimmer 2s ease-in-out infinite', height: `${lineHeight}px` }}
    />
  );
}

export function SkeletonGrid({
  rows = 2,
  cols = 3,
}: {
  rows?: number;
  cols?: number;
} = {}) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array(rows * cols).fill(0).map((_, i) => (
        <SkeletonLine key={i} height={8} />
      ))}
    </div>
  );
}
