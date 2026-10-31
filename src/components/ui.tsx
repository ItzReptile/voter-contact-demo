// Small shared building blocks. Server-safe (no hooks), so any component can use them.
import type { ReactNode } from "react";

export const buttonClass =
  "rounded bg-button px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClass =
  "rounded border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:bg-line disabled:opacity-50";

export const inputClass =
  "rounded border border-line bg-surface px-2 py-1.5 text-sm focus:outline-2 focus:outline-button";

export const linkClass = "text-link underline-offset-2 hover:underline";

export function PageHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-2">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-line bg-surface p-4 ${className}`}>
      {title && <h2 className="mb-3 text-sm font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

/** A table that scrolls sideways on narrow screens instead of breaking the layout. */
export function Table({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table aria-label={label} className="w-full text-left text-sm [&_td]:border-t [&_td]:border-line [&_td]:px-2 [&_td]:py-2 [&_th]:px-2 [&_th]:pb-2 [&_th]:text-xs [&_th]:font-medium [&_th]:text-ink-2">
        {children}
      </table>
    </div>
  );
}

/** Right-aligned numeric cell with digits that line up down the column. */
export function Num({ children }: { children: ReactNode }) {
  return <td className="text-right tabular-nums">{children}</td>;
}

/** Progress toward a whole, e.g. voters attempted out of list size. Track and fill share one hue. */
export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      title={`${value} of ${max}`}
      className="h-2 w-24 overflow-hidden rounded-full"
      style={{ background: "var(--meter-track)" }}
    >
      <div className="h-full rounded-full" style={{ width: `${percent}%`, background: "var(--meter-fill)" }} />
    </div>
  );
}

/** Suspense fallback while a page's data loads. */
export function Loading() {
  return <p className="text-sm text-ink-2">Loading…</p>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-ink-2">{children}</p>;
}
