// Dashboard charts in plain HTML, server rendered and printed in two inks: orange for
// conversations, indigo for every other attempt. Each chart has a hover (and keyboard focus)
// tooltip or a visible label, plus an equivalent table for screen readers, so no value
// depends on color alone.
import type { ReactNode } from "react";
import { formatDay, niceScale } from "@/lib/chart";
import { formatNumber, formatPercent, rate } from "@/lib/format";

/** One ink in a stacked chart: a color and the series printed in it. The first ink sits on the baseline. */
export type Ink<K extends string> = { label: string; color: string; parts: { key: K; label: string }[] };

type Day<K extends string> = { day: string } & Record<K, number>;

function inkTotal<K extends string>(day: Day<K>, ink: Ink<K>): number {
  return ink.parts.reduce((sum, part) => sum + day[part.key], 0);
}

/**
 * Opens just above its column, toward the middle of the chart, so tooltips near an edge never
 * stick out of the page. Hidden from screen readers: the column's label and the table say the same.
 */
function Tooltip({ children, side, bottom }: { children: ReactNode; side: "left" | "right"; bottom: string }) {
  return (
    <div
      aria-hidden
      style={{ bottom }}
      className={`pointer-events-none absolute z-10 mb-2 w-max min-w-40 rounded-lg border border-line bg-paper px-3 py-2 caption-5 opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus:opacity-100 ${
        side === "left" ? "left-0" : "right-0"
      }`}
    >
      {children}
    </div>
  );
}

/**
 * Stacked columns per day, one block per ink, with a sliver of paper between the inks.
 * The baseline is printed in solid ink; gridlines stay recessive.
 */
export function DailyColumns<K extends string>({
  label,
  days,
  inks,
  emptyText,
}: {
  label: string;
  days: Day<K>[];
  inks: Ink<K>[];
  emptyText: string;
}) {
  const totals = days.map((day) => inks.reduce((sum, ink) => sum + inkTotal(day, ink), 0));
  const { top, ticks } = niceScale(Math.max(...totals, 0));
  const parts = inks.flatMap((ink) => ink.parts);

  return (
    // clip, not hidden: tooltips still rise above the columns, but a wide one can't push the page sideways.
    <figure className="min-w-0 overflow-x-clip">
      <div className="relative ml-8">
        <div aria-hidden className="absolute inset-0">
          {ticks.map((tick) => (
            <div
              key={tick}
              className={`absolute inset-x-0 ${tick === 0 ? "" : "border-t border-line-soft"}`}
              style={{ bottom: `${(tick / top) * 100}%` }}
            >
              <span className="absolute -top-2 -left-8 w-6 text-right caption-5 text-muted tabular-nums">{tick}</span>
            </div>
          ))}
        </div>
        {totals.every((total) => total === 0) && (
          <p className="absolute inset-0 flex items-center justify-center px-4 text-center caption-2 text-muted">{emptyText}</p>
        )}
        <div className="group/chart relative flex h-56 items-end gap-1 sm:h-64 sm:gap-2 lg:h-80">
          {days.map((day, index) => {
            const height = `${(totals[index] / top) * 100}%`;
            return (
              <div
                key={day.day}
                tabIndex={0}
                role="img"
                aria-label={`${formatDay(day.day)}: ${inks.map((ink) => `${inkTotal(day, ink)} ${ink.label.toLowerCase()}`).join(", ")}`}
                className="group relative flex h-full min-w-0 flex-1 flex-col justify-end outline-offset-4"
              >
                <div
                  className="flex flex-col-reverse gap-0.5 transition-opacity duration-150 ease-out group-hover/chart:opacity-50 group-hover:opacity-100"
                  style={{ height }}
                >
                  {inks.map((ink) => {
                    const value = inkTotal(day, ink);
                    return value > 0 ? <div key={ink.label} style={{ flexGrow: value, flexBasis: 0, background: ink.color }} /> : null;
                  })}
                </div>
                <Tooltip side={index < days.length / 2 ? "left" : "right"} bottom={height}>
                  <p className="caption-3 text-ink">{formatDay(day.day)}</p>
                  {inks.map((ink) => (
                    <div key={ink.label} className="mt-1">
                      <p className="flex items-center gap-2 text-ink-2">
                        <span className="size-2 shrink-0" style={{ background: ink.color }} />
                        {ink.label}
                        <span className="ml-auto pl-4 caption-3 text-ink tabular-nums">{inkTotal(day, ink)}</span>
                      </p>
                      {ink.parts.length > 1 &&
                        ink.parts.map((part) => (
                          <p key={part.key} className="flex pl-4 text-muted">
                            {part.label}
                            <span className="ml-auto pl-4 tabular-nums">{day[part.key]}</span>
                          </p>
                        ))}
                    </div>
                  ))}
                </Tooltip>
              </div>
            );
          })}
        </div>
      </div>
      <div aria-hidden className="ml-8 h-0.5 bg-ink" />
      {/* A date under every third column, ending on today. */}
      <div aria-hidden className="mt-2 ml-8 flex gap-1 sm:gap-2">
        {days.map((day, index) => {
          const fromEnd = days.length - 1 - index;
          return (
            <span
              key={day.day}
              className={`flex min-w-0 flex-1 caption-5 text-muted ${fromEnd === 0 ? "justify-end" : "justify-center"}`}
            >
              {fromEnd % 3 === 0 && <span className="whitespace-nowrap">{formatDay(day.day)}</span>}
            </span>
          );
        })}
      </div>
      <figcaption className="sr-only">{label}</figcaption>
      {/* A table is never narrower than its content, so the 1px screen reader box wraps it. */}
      <div className="sr-only">
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th>Day</th>
              {parts.map((part) => (
                <th key={part.key}>{part.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.day}>
                <td>{formatDay(day.day)}</td>
                {parts.map((part) => (
                  <td key={part.key}>{day[part.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

/** The key to a two ink chart: each ink with its total, and what an ink of several parts is made of. */
export function Legend<K extends string>({ inks, days }: { inks: Ink<K>[]; days: Day<K>[] }) {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-3">
      {inks.map((ink) => {
        const total = days.reduce((sum, day) => sum + inkTotal(day, ink), 0);
        return (
          <li key={ink.label} className="caption-2 text-ink-2">
            <span className="flex items-center gap-3">
              <span aria-hidden className="size-3 shrink-0" style={{ background: ink.color }} />
              {ink.label}
              <span className="body-4 text-ink tabular-nums">{formatNumber(total)}</span>
            </span>
            {ink.parts.length > 1 && (
              <span className="mt-1 block pl-6 caption-5 text-muted">
                {ink.parts
                  .map((part) => `${formatNumber(days.reduce((sum, day) => sum + day[part.key], 0))} ${part.label.toLowerCase()}`)
                  .join(", ")}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * One hang tag per row: a punched hole, the label, the rate in big condensed figures, and a strip
 * printed in two inks (orange for the part, indigo for the rest). A row with nothing to divide
 * by is an unprinted tag with a dashed edge.
 */
export function RateTags({
  label,
  rows,
}: {
  label: string;
  rows: { key: string; label: string; part: number; whole: number; detail: string }[];
}) {
  return (
    <ul aria-label={label} className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {rows.map((row) => {
        const value = rate(row.part, row.whole);
        return (
          <li
            key={row.key}
            className={`relative flex min-w-0 flex-col rounded-xl px-3 pt-10 pb-3 sm:px-4 sm:pb-4 ${
              value === null ? "border border-dashed border-line" : "bg-soft"
            }`}
          >
            <span
              aria-hidden
              className={`absolute top-3 left-1/2 size-4 -translate-x-1/2 rounded-full bg-stock ${value === null ? "border border-dashed border-line" : ""}`}
            />
            <span title={row.label} className={`line-clamp-2 title-4 ${value === null ? "text-muted" : "text-ink"}`}>{row.label}</span>
            <span className={`mt-2 figure text-3xl ${value === null ? "text-muted" : "text-ink"}`}>{formatPercent(value)}</span>
            <span className="mt-1 caption-5 text-ink-2">{row.detail}</span>
            <span aria-hidden className="mt-auto pt-3">
              <span className="flex h-1.5 gap-0.5">
                {row.part > 0 && <span className="bg-orange" style={{ flexGrow: row.part, flexBasis: 0 }} />}
                {row.whole - row.part > 0 && <span className="bg-indigo" style={{ flexGrow: row.whole - row.part, flexBasis: 0 }} />}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
