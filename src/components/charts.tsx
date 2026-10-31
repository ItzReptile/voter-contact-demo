// Dashboard charts in plain HTML and SVG, server rendered. Each has a hover (and keyboard
// focus) tooltip and an equivalent table for screen readers, so no value depends on color alone.
import type { ReactNode } from "react";
import { formatDay, niceScale, sparklinePath } from "@/lib/chart";
import { formatNumber, formatPercent, rate } from "@/lib/format";

export function Sparkline({ values, color, label }: { values: number[]; color: string; label: string }) {
  const path = sparklinePath(values, 120, 32);
  return (
    <svg viewBox="0 0 120 34" preserveAspectRatio="none" role="img" aria-label={label} className="h-8 w-full overflow-visible">
      <path d={path} transform="translate(0 1)" fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Opens toward the middle of the chart, so tooltips near an edge never stick out of the page. */
function Tooltip({ children, side }: { children: ReactNode; side: "left" | "right" }) {
  return (
    <div
      role="tooltip"
      className={`pointer-events-none absolute bottom-full z-10 mb-2 w-max rounded-lg border border-line bg-surface px-3 py-2 caption-5 opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 ${
        side === "left" ? "left-0" : "right-0"
      }`}
    >
      {children}
    </div>
  );
}

export type Series<K extends string> = { key: K; label: string; color: string };

/** Stacked columns per day, one segment per series, with a 2px gap between segments. */
export function DailyColumns<K extends string>({
  label,
  days,
  series,
}: {
  label: string;
  days: ({ day: string } & Record<K, number>)[];
  series: Series<K>[];
}) {
  const totals = days.map((day) => series.reduce((sum, s) => sum + day[s.key], 0));
  const { top, ticks } = niceScale(Math.max(...totals, 0));

  return (
    <figure>
      <div className="relative pl-8">
        {/* Gridlines with their values, recessive. */}
        <div aria-hidden className="absolute inset-y-0 right-0 left-8">
          {ticks.map((tick) => (
            <div key={tick} className="absolute inset-x-0 border-t border-line-soft" style={{ bottom: `${(tick / top) * 100}%` }}>
              <span className="absolute -top-2 -left-8 w-6 text-right caption-5 text-faint tabular-nums">{tick}</span>
            </div>
          ))}
        </div>
        <div className="relative flex h-48 items-end gap-1 sm:gap-2">
          {days.map((day, index) => (
            <div
              key={day.day}
              tabIndex={0}
              aria-label={`${formatDay(day.day)}: ${totals[index]} attempts`}
              className="group relative flex h-full flex-1 flex-col justify-end rounded-sm outline-offset-4"
            >
              <div
                className="flex flex-col-reverse gap-0.5 overflow-hidden rounded-t-sm transition-opacity duration-300 group-hover:opacity-80"
                style={{ height: `${(totals[index] / top) * 100}%` }}
              >
                {series.map((s) =>
                  day[s.key] > 0 ? <div key={s.key} style={{ flexGrow: day[s.key], flexBasis: 0, background: s.color }} /> : null,
                )}
              </div>
              <Tooltip side={index < days.length / 2 ? "left" : "right"}>
                <p className="caption-3 text-ink">{formatDay(day.day)}</p>
                {series.map((s) => (
                  <p key={s.key} className="mt-1 flex items-center gap-2 text-muted">
                    <span className="size-2 rounded-sm" style={{ background: s.color }} />
                    {s.label}
                    <span className="ml-auto pl-4 text-ink tabular-nums">{day[s.key]}</span>
                  </p>
                ))}
              </Tooltip>
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden className="mt-2 flex gap-1 pl-8 sm:gap-2">
        {days.map((day, index) => (
          <span key={day.day} className="flex-1 text-center caption-5 text-faint">
            {index % 2 === days.length % 2 ? formatDay(day.day).replace(" ", " ") : ""}
          </span>
        ))}
      </div>
      <figcaption className="sr-only">{label}</figcaption>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>Day</th>
            {series.map((s) => (
              <th key={s.key}>{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.day}>
              <td>{formatDay(day.day)}</td>
              {series.map((s) => (
                <td key={s.key}>{day[s.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function Legend<K extends string>({ series, totals }: { series: Series<K>[]; totals: Record<K, number> }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-2 caption-2 text-muted">
          <span aria-hidden className="size-2 rounded-sm" style={{ background: s.color }} />
          {s.label}
          <span className="text-ink tabular-nums">{formatNumber(totals[s.key])}</span>
        </li>
      ))}
    </ul>
  );
}

/** One horizontal bar per row (a rate from 0 to 1), labeled with its value. */
export function RateBars({
  label,
  rows,
}: {
  label: string;
  rows: { key: string; label: string; part: number; whole: number; detail: string }[];
}) {
  return (
    <table aria-label={label} className="w-full body-6">
      <tbody>
        {rows.map((row) => {
          const value = rate(row.part, row.whole);
          return (
            <tr key={row.key} className="group">
              <th scope="row" className="w-16 py-2 pr-3 text-left caption-1 whitespace-nowrap">
                {row.label}
              </th>
              <td className="w-full py-2">
                <div className="relative h-2 rounded-full bg-hover" title={row.detail}>
                  {value !== null && (
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-accent transition-opacity duration-300 group-hover:opacity-80"
                      style={{ width: `${Math.max(value * 100, 2)}%` }}
                    />
                  )}
                </div>
              </td>
              <td className="w-12 py-2 pl-3 text-right tabular-nums">{formatPercent(value)}</td>
              <td className="hidden w-28 py-2 pl-3 text-right caption-5 whitespace-nowrap text-muted sm:table-cell">{row.detail}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
