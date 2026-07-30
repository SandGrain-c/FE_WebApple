type AdminNotificationBadgeProps = {
  value?: number | null;
  size?: "sm" | "md";
};

export default function AdminNotificationBadge({
  value,
  size = "sm",
}: AdminNotificationBadgeProps) {
  const safeValue = Number(value || 0);

  if (safeValue <= 0) {
    return null;
  }

  const label = safeValue > 99 ? "99+" : String(safeValue);

  const sizeClass =
    size === "md"
      ? "min-w-6 h-6 px-2 text-xs"
      : "min-w-5 h-5 px-1.5 text-[11px]";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-red-600 font-bold leading-none text-white shadow-sm ${sizeClass}`}
    >
      {label}
    </span>
  );
}