export function ProgressBar({
  value,
  max,
  color = "var(--accent)",
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const percent = max > 0 ? Math.min(value / max, 1) * 100 : 0;

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-border">
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-out"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}
