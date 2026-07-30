type SkeletonProps = {
  className?: string;
};

export function SkeletonBox({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-surface-container-high ${className}`}
    />
  );
}

export function SkeletonLine({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-full bg-surface-container-high ${className}`}
    />
  );
}

export function SkeletonCircle({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-full bg-surface-container-high ${className}`}
    />
  );
}