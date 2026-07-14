export type HeatmapDayState = "met" | "under" | "none" | "future";
export type HeatmapDay = { dayKey: string; date: Date; dayOfWeek: number; state: HeatmapDayState };

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Every-other-row labeling, matching the sparse convention GitHub's own contribution graph uses —
// labeling all 7 rows reads as noisy at this cell size.
const LABELED_ROWS = new Set([1, 3, 5]);

const STATE_CLASS: Record<HeatmapDayState, string> = {
  met: "bg-accent",
  under: "bg-accent/50",
  none: "bg-surface-border",
  future: "bg-transparent",
};

// Days of a single calendar month, laid out GitHub-contributions-style — rows are day-of-week,
// columns are weeks — rather than a standard top-down calendar grid, matching the reference look
// this was modeled on. `state` is precomputed by the caller (which day is "future," which goal was
// met) — this component only lays cells out, no date math.
export function ActivityHeatmap({ days }: { days: HeatmapDay[] }) {
  if (days.length === 0) return null;

  const firstDayOfWeek = days[0].dayOfWeek;
  const totalColumns = Math.ceil((firstDayOfWeek + days.length) / 7);
  const grid: (HeatmapDay | null)[][] = Array.from({ length: totalColumns }, () => Array(7).fill(null));
  days.forEach((day, index) => {
    const absolute = firstDayOfWeek + index;
    grid[Math.floor(absolute / 7)][absolute % 7] = day;
  });

  const monthLabel = days[0].date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-surface-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Activity</h2>
        <span className="text-xs text-foreground-tertiary">{monthLabel}</span>
      </div>

      <div className="flex gap-[3px] overflow-x-auto">
        <div className="flex flex-col gap-[3px] pr-1">
          {DOW_LABELS.map((label, row) => (
            <span key={label} className="flex h-3 items-center text-[10px] text-foreground-tertiary">
              {LABELED_ROWS.has(row) ? label : ""}
            </span>
          ))}
        </div>
        {grid.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-[3px]">
            {column.map((day, row) => (
              <div
                key={row}
                className={`h-3 w-3 rounded-[3px] ${day ? STATE_CLASS[day.state] : "bg-transparent"}`}
                title={day ? day.dayKey : undefined}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-1.5 text-[10px] text-foreground-tertiary">
        Less
        <span className="h-3 w-3 rounded-[3px] bg-surface-border" aria-hidden />
        <span className="h-3 w-3 rounded-[3px] bg-accent/50" aria-hidden />
        <span className="h-3 w-3 rounded-[3px] bg-accent" aria-hidden />
        More
      </div>
    </section>
  );
}
