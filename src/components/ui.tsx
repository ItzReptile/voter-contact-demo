// Shared building blocks for the door hanger look. Server-safe (no hooks).
// Two inks: indigo for the product and its actions, orange for the outcome that matters.
// Text uses the named styles from globals.css; big numbers use `figure`.
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";

// Pressable things get hover, active (scale 0.97, motion-safe only) and disabled states.
// Focus rings come from :focus-visible in globals.css. Transitions are short (150-200ms).
// On phones every button and field is at least 44px tall, a thumb's width.
const pressableBase =
  "inline-flex max-sm:min-h-11 shrink-0 items-center justify-center gap-2 rounded-md whitespace-nowrap transition-[transform,background-color,border-color,color,opacity] duration-150 ease-out motion-safe:active:scale-97 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:disabled:active:scale-100 aria-disabled:pointer-events-none aria-disabled:opacity-40";
const pressable = `${pressableBase} px-3 py-2`;

/** The main action on a page: solid indigo. */
export const buttonClass = `${pressable} button-sm bg-indigo text-white hover:bg-indigo-hover`;

/** A large main action (landing page, canvass view). */
export const bigButtonClass = `${pressableBase} px-6 py-3 button-md bg-indigo text-white hover:bg-indigo-hover`;

export const secondaryButtonClass = `${pressable} button-sm border border-line bg-paper text-ink hover:border-indigo hover:text-indigo`;

export const ghostButtonClass = `${pressable} button-sm text-muted hover:bg-soft hover:text-ink`;

// 16px text on phones so iOS Safari doesn't zoom in when a field is tapped.
export const inputClass =
  "h-9 max-sm:h-11 rounded-md border border-line bg-paper px-3 body-6 max-sm:body-3 text-ink placeholder:text-muted transition-[border-color,background-color] duration-150 ease-out hover:border-faint disabled:cursor-not-allowed disabled:bg-stock disabled:text-faint";

export const linkClass = "text-indigo underline decoration-indigo/30 underline-offset-4 transition duration-150 ease-out hover:decoration-indigo";

/** "‹ Lists": the way back up, the same on every page. 44px tall for a thumb; long names truncate (full name on hover). */
export function BackLink({ href, children, title }: { href: string; children: ReactNode; title?: string }) {
  return (
    <Link
      href={href}
      title={title}
      className="-ml-2 inline-flex min-h-11 max-w-full items-center gap-1 rounded-md px-2 caption-1 text-muted transition-colors duration-150 ease-out hover:text-ink"
    >
      <CaretLeft size={14} aria-hidden className="shrink-0" />
      <span className="truncate">{children}</span>
    </Link>
  );
}

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
        <h1 className="heading-3">{title}</h1>
        {description && <p className="mt-2 max-w-2xl body-3 text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** A piece of card stock: white, generous corners like a die cut, a hairline edge, no shadow. */
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
    <section className={`min-w-0 rounded-2xl border border-line bg-paper ${className}`}>
      {(title || action) && (
        <div className={`flex flex-wrap items-start justify-between gap-2 ${padded ? "px-4 pt-4 sm:px-6 sm:pt-6" : "px-4 py-4 sm:px-6"}`}>
          <div>
            {title && <h2 className="heading-6">{title}</h2>}
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
        className="w-full text-left body-6 [&_td]:border-t [&_td]:border-line-soft [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-2 [&_th]:caption-3 [&_th]:whitespace-nowrap [&_th]:text-muted [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-150 [&_tbody_tr:hover]:bg-stock"
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

/** Progress toward a whole: indigo ink on a pale indigo track. */
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
      className={`h-1.5 shrink-0 overflow-hidden rounded-full bg-soft ${className}`}
    >
      <div className="h-full rounded-full bg-indigo" style={{ width: `${percent}%` }} />
    </div>
  );
}

/** "teal" and "plum" are older names kept until every screen is restyled. */
export type TagTone = "neutral" | "accent" | "orange" | "ink" | "danger" | "teal" | "plum";

const TAG_TONES: Record<TagTone, string> = {
  neutral: "bg-stock text-ink-2 ring-1 ring-line ring-inset",
  accent: "bg-soft text-indigo-deep",
  orange: "bg-orange text-ink",
  ink: "bg-paper text-ink ring-1 ring-ink/30 ring-inset",
  danger: "bg-danger-tint text-danger",
  teal: "bg-orange text-ink",
  plum: "bg-paper text-ink ring-1 ring-ink/30 ring-inset",
};

/** A small printed label. The words carry the meaning; the ink just sorts them. */
export function Tag({ tone = "neutral", children }: { tone?: TagTone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 caption-3 whitespace-nowrap ${TAG_TONES[tone]}`}>
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
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-paper px-4 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-soft text-indigo">{icon}</div>
      <h2 className="heading-5">{title}</h2>
      <p className="mt-2 max-w-sm body-6 text-ink-2">{children}</p>
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
    <p role="alert" className="flex w-full items-start gap-2 rounded-md bg-danger-tint px-3 py-2 body-5 text-danger">
      <svg aria-hidden viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0" fill="currentColor">
        <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM7.25 4.5h1.5v4.75h-1.5V4.5Zm0 6h1.5V12h-1.5v-1.5Z" />
      </svg>
      <span>{children}</span>
    </p>
  );
}

/**
 * The door hanger shape: a tall piece of card stock with a knob hole near the top.
 * Screens can use it for their one signature moment (`swing` makes it settle on load).
 */
export function Hanger({ children, className = "", swing = false }: { children: ReactNode; className?: string; swing?: boolean }) {
  return (
    <div
      className={`relative rounded-3xl border border-line bg-paper pt-16 ${swing ? "origin-[50%_32px] motion-safe:animate-swing" : ""} ${className}`}
    >
      <span aria-hidden className="absolute top-4 left-1/2 size-8 -translate-x-1/2 rounded-full border border-line bg-stock" />
      {/* The slit from the knob hole, so the hanger can slip over a doorknob. */}
      <span aria-hidden className="absolute top-12 left-1/2 h-4 w-0.5 -translate-x-1/2 bg-line" />
      {children}
    </div>
  );
}
