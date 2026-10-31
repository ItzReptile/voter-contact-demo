// Shared building blocks. Server-safe (no hooks), so any component can use them.
// Visual rules: .claude/skills/landing-page-design. Text uses the named styles from globals.css.
import Link from "next/link";
import type { ReactNode } from "react";

// Pressable things get hover, active (scale 0.98, motion-safe only) and disabled states.
// Focus rings come from :focus-visible in globals.css.
const pressable =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 transition motion-safe:active:scale-98 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:disabled:active:scale-100";

/** Main action on a page. */
export const buttonClass = `${pressable} button-md bg-button text-button-ink hover:opacity-90`;

/** Main action inside a row or a dense form. */
export const smallButtonClass = `${pressable} button-sm bg-button text-button-ink hover:opacity-90`;

export const secondaryButtonClass = `${pressable} button-sm border border-line bg-surface text-ink hover:bg-raised`;

export const inputClass =
  "rounded-lg border border-line bg-surface px-3 py-2 body-6 text-ink transition hover:border-ink-2 disabled:cursor-not-allowed disabled:opacity-50";

export const linkClass = "text-link underline-offset-4 transition hover:underline";

export function PageHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="heading-4">{title}</h1>
        {description && <p className="mt-2 max-w-2xl body-6 text-ink-2">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-4 sm:p-6 ${className}`}>
      {title && <h2 className="mb-4 heading-6">{title}</h2>}
      {children}
    </section>
  );
}

/** A table that scrolls sideways on narrow screens instead of breaking the layout. */
export function Table({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table
        aria-label={label}
        className="w-full text-left body-6 [&_td]:border-t [&_td]:border-line [&_td]:px-2 [&_td]:py-3 [&_th]:px-2 [&_th]:pb-2 [&_th]:caption-4 [&_th]:whitespace-nowrap [&_th]:text-ink-2"
      >
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
      className="h-2 w-24 shrink-0 overflow-hidden rounded-full"
      style={{ background: "var(--meter-track)" }}
    >
      <div className="h-full rounded-full" style={{ width: `${percent}%`, background: "var(--meter-fill)" }} />
    </div>
  );
}

/** A composed "nothing here yet" view: what this is, and the next step. */
export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-surface px-4 py-12 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-raised text-ink-2">{icon}</div>
      <h2 className="title-2">{title}</h2>
      <p className="mt-2 max-w-sm body-6 text-ink-2">{children}</p>
      {action && (
        <Link href={action.href} className={`${smallButtonClass} mt-6`}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
