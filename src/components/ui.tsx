// Shared building blocks. Server-safe (no hooks), so any component can use them.
// Visual rules: .claude/skills/landing-page-design. Text uses the named styles from globals.css.
import Link from "next/link";
import type { ReactNode } from "react";

// Pressable things get hover, active (scale 0.98, motion-safe only) and disabled states.
// Focus rings come from :focus-visible in globals.css.
const pressable =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 whitespace-nowrap transition motion-safe:active:scale-98 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:disabled:active:scale-100";

/** Main action on a page. */
export const buttonClass = `${pressable} button-sm bg-accent text-white hover:bg-accent-hover`;

/** A large main action (intro page, canvass view). */
export const bigButtonClass = `${pressable} button-md bg-accent text-white hover:bg-accent-hover`;

export const secondaryButtonClass = `${pressable} button-sm border border-line bg-surface text-ink hover:bg-hover`;

export const ghostButtonClass = `${pressable} button-sm text-ink-2 hover:bg-hover hover:text-ink`;

export const inputClass =
  "h-9 rounded-lg border border-line bg-surface px-3 body-6 text-ink placeholder:text-faint transition hover:border-faint disabled:cursor-not-allowed disabled:bg-subtle disabled:text-faint";

export const linkClass = "text-accent-ink underline-offset-4 transition hover:underline";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="heading-5">{title}</h1>
        {description && <p className="mt-1 max-w-2xl body-6 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className = "",
  padded = true,
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`min-w-0 rounded-xl border border-line bg-surface ${className}`}>
      {(title || action) && (
        <div className={`flex flex-wrap items-start justify-between gap-2 ${padded ? "px-4 pt-4 sm:px-6 sm:pt-6" : "px-4 py-4 sm:px-6"}`}>
          <div>
            {title && <h2 className="title-3">{title}</h2>}
            {description && <p className="mt-1 caption-2 text-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={padded ? "p-4 sm:p-6" : ""}>{children}</div>
    </section>
  );
}

/** A dense table that scrolls sideways on narrow screens instead of breaking the layout. */
export function Table({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table
        aria-label={label}
        className="w-full text-left body-6 [&_td]:border-t [&_td]:border-line-soft [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-2 [&_th]:caption-4 [&_th]:whitespace-nowrap [&_th]:text-muted [&_thead_tr]:bg-subtle [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-subtle"
      >
        {children}
      </table>
    </div>
  );
}

/** Right-aligned numeric cell with digits that line up down the column. */
export function Num({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`text-right tabular-nums ${className}`}>{children}</td>;
}

/** Progress toward a whole, e.g. voters attempted out of list size. Track and fill share one hue. */
export function Meter({ value, max, label, className = "w-24" }: { value: number; max: number; label: string; className?: string }) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      title={`${value} of ${max}`}
      className={`h-1.5 shrink-0 overflow-hidden rounded-full bg-accent-tint ${className}`}
    >
      <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
    </div>
  );
}

export type TagTone = "neutral" | "accent" | "teal" | "orange" | "plum" | "danger";

const TAG_TONES: Record<TagTone, { box: string; dot: string }> = {
  neutral: { box: "bg-hover text-ink-2", dot: "bg-faint" },
  accent: { box: "bg-accent-tint text-accent-ink", dot: "bg-accent" },
  teal: { box: "bg-teal-tint text-teal-ink", dot: "bg-teal" },
  orange: { box: "bg-orange-tint text-orange-ink", dot: "bg-orange" },
  plum: { box: "bg-plum-tint text-plum-ink", dot: "bg-plum" },
  danger: { box: "bg-danger-tint text-danger", dot: "bg-danger" },
};

/** A small status pill. The dot plus the label carry meaning, never color alone. */
export function Tag({ tone = "neutral", children, dot = true }: { tone?: TagTone; children: ReactNode; dot?: boolean }) {
  const { box, dot: dotClass } = TAG_TONES[tone];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-2 py-0.5 caption-4 whitespace-nowrap ${box}`}>
      {dot && <span aria-hidden className={`size-1.5 rounded-full ${dotClass}`} />}
      {children}
    </span>
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
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-surface px-4 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-accent-tint text-accent">{icon}</div>
      <h2 className="title-2">{title}</h2>
      <p className="mt-2 max-w-sm body-6 text-muted">{children}</p>
      {action && (
        <Link href={action.href} className={`${buttonClass} mt-6`}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

/** Inline, specific error text. Never alert(). */
export function InlineError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex w-full items-start gap-2 rounded-lg bg-danger-tint px-3 py-2 body-5 text-danger">
      <svg aria-hidden viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0" fill="currentColor">
        <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM7.25 4.5h1.5v4.75h-1.5V4.5Zm0 6h1.5V12h-1.5v-1.5Z" />
      </svg>
      <span>{children}</span>
    </p>
  );
}
