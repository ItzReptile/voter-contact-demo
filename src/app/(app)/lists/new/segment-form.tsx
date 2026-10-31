"use client";

import { ArrowDown, DoorOpen, Phone } from "@phosphor-icons/react";
import { useId, useRef, type FormEvent, type ReactNode } from "react";
import { InlineError, inputClass, secondaryButtonClass } from "@/components/ui";
import { useFilterNavigation } from "@/components/url-filters";
import { CONTACT_FILTER_LABELS, CONTACT_FILTERS, PARTIES, PARTY_LABELS, type ListKind } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import type { SegmentErrors } from "@/lib/segments";

/**
 * The segment filters. Every change updates the URL (debounced), and the server renders the
 * new count and preview. Without JavaScript, the Preview button submits the same GET form.
 */
export function SegmentForm({
  kind,
  query,
  precincts,
  count,
  errors,
}: {
  kind: ListKind;
  query: string;
  precincts: string[];
  /** Voters matching the current filters, or null while a filter is out of range. */
  count: number | null;
  /** Problems with the age or score range, shown under those inputs. */
  errors: SegmentErrors;
}) {
  const values = new URLSearchParams(query);
  const { navigate } = useFilterNavigation();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const apply = (form: HTMLFormElement, delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams();
      for (const [key, value] of new FormData(form)) {
        if (typeof value === "string" && value !== "" && !(key === "contact" && value === "any")) params.append(key, value);
      }
      navigate(`/lists/new?${params}`);
    }, delay);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    apply(event.currentTarget, 0);
  };

  const checked = (name: string, value: string) => values.getAll(name).includes(value);

  return (
    <form
      action="/lists/new"
      onSubmit={onSubmit}
      // Typing in a number waits a moment; clicks apply right away.
      onChange={(event) => {
        const field = event.target as EventTarget as HTMLInputElement;
        apply(event.currentTarget, field.type === "number" ? 400 : 0);
      }}
      className="grid min-w-0 gap-8 rounded-2xl border border-line bg-paper p-4 sm:p-6 @4xl:sticky @4xl:top-24"
    >
      <Group legend="List type">
        {/* Side by side while each card has room for "knocking"; stacked at large text sizes. */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(7rem,100%),1fr))] gap-2">
          <KindOption value="door" checked={kind === "door"} icon={<DoorOpen size={20} aria-hidden />} title="Door knocking" detail="In walk order" />
          <KindOption value="phone" checked={kind === "phone"} icon={<Phone size={20} aria-hidden />} title="Phone calls" detail="Has a phone" />
        </div>
      </Group>

      <Group legend="Precincts" hint="None picked means all">
        <div className="flex flex-wrap gap-2">
          {precincts.map((precinct) => (
            <Chip key={precinct} name="precinct" value={precinct} defaultChecked={checked("precinct", precinct)}>
              {precinct}
            </Chip>
          ))}
        </div>
      </Group>

      <Group legend="Party" hint="None picked means all">
        <div className="flex flex-wrap gap-2">
          {PARTIES.map((party) => (
            <Chip key={party} name="party" value={party} defaultChecked={checked("party", party)}>
              {PARTY_LABELS[party]}
            </Chip>
          ))}
        </div>
      </Group>

      <Range legend="Age" name="Age" min={18} max={120} values={values} error={errors.age} />
      <Range legend="Support score" name="Score" min={0} max={100} values={values} error={errors.score} />

      <label className="grid gap-3">
        <span className="title-4">Contact history</span>
        <select name="contact" defaultValue={values.get("contact") ?? "any"} className={`${inputClass} min-w-0 cursor-pointer`}>
          {CONTACT_FILTERS.map((value) => (
            <option key={value} value={value}>
              {CONTACT_FILTER_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <noscript>
        <button type="submit" className={secondaryButtonClass}>
          Preview
        </button>
      </noscript>

      <CountBar count={count} />
    </form>
  );
}

/**
 * In one column the count sits under the filters, out of sight while you change them. This bar
 * docks to the bottom of the screen while the filters scroll by, then settles at their end.
 */
function CountBar({ count }: { count: number | null }) {
  const { pending } = useFilterNavigation();
  return (
    <div
      className={`sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl px-4 py-3 transition-opacity duration-200 ease-out @4xl:hidden ${
        pending ? "opacity-60" : ""
      } ${count ? "bg-indigo text-white" : "bg-soft text-ink-2"}`}
    >
      {count === null ? (
        <p className="body-5">Fix the filters to see a count</p>
      ) : (
        <p className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span className="figure text-3xl">{formatNumber(count)}</span>
          <span className="body-5">{count === 1 ? "voter matches" : "voters match"}</span>
        </p>
      )}
      {count ? (
        // A jump to the name field and the Create list button under the count.
        <a href="#matching-voters" className="inline-flex shrink-0 items-center gap-1 rounded-sm button-sm underline decoration-white/40 underline-offset-4 transition duration-150 ease-out hover:decoration-white focus-visible:outline-white">
          Create list
          <ArrowDown size={14} aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

function Group({ legend, hint, children }: { legend: string; hint?: string; children: ReactNode }) {
  // min-w-0: a fieldset is as wide as its content by default, which would push the form sideways.
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 flex w-full flex-wrap items-baseline justify-between gap-2">
        <span className="title-4">{legend}</span>
        {hint && <span className="caption-5 text-muted">{hint}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

// Picked options print in solid indigo, like ink on the card. The real input covers the whole
// option (invisible), so a click anywhere toggles it and the label stays its accessible name.
const pickable =
  "group relative flex cursor-pointer items-center gap-2 border transition duration-150 ease-out motion-safe:active:scale-97 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo has-[:checked]:border-indigo has-[:checked]:bg-indigo has-[:checked]:text-white";

const hiddenInput = "absolute inset-0 size-full cursor-pointer appearance-none rounded-[inherit] opacity-0";

function KindOption({
  value,
  checked,
  icon,
  title,
  detail,
}: {
  value: ListKind;
  checked: boolean;
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <label className={`${pickable} flex-col items-start rounded-lg border-line bg-paper p-3 hover:border-indigo`}>
      <input type="radio" name="kind" value={value} defaultChecked={checked} className={hiddenInput} />
      <span className="flex w-full items-center justify-between">
        {icon}
        <span aria-hidden className="flex size-4 items-center justify-center rounded-full border border-faint bg-paper group-has-[:checked]:border-paper">
          <span className="size-2 rounded-full bg-indigo opacity-0 transition-opacity duration-150 ease-out group-has-[:checked]:opacity-100" />
        </span>
      </span>
      <span className="title-4">{title}</span>
      <span className="caption-5 text-muted group-has-[:checked]:text-white">{detail}</span>
    </label>
  );
}

function Chip({
  name,
  value,
  defaultChecked,
  children,
}: {
  name: string;
  value: string;
  defaultChecked: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`${pickable} rounded-full border-line bg-paper py-1 pr-3 pl-2 caption-1 hover:border-indigo`}>
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className={hiddenInput} />
      <span aria-hidden className="flex size-4 items-center justify-center rounded border border-faint bg-paper text-indigo group-has-[:checked]:border-paper">
        <svg viewBox="0 0 16 16" className="size-3 opacity-0 transition-opacity duration-150 ease-out group-has-[:checked]:opacity-100">
          <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {children}
    </label>
  );
}

// The bounds sit beside the legend; the placeholder is a word, so an empty field never reads
// as a number someone typed. A problem with the range shows under both inputs and marks them.
function Range({
  legend,
  name,
  min,
  max,
  values,
  error,
}: {
  legend: string;
  name: string;
  min: number;
  max: number;
  values: URLSearchParams;
  error?: string;
}) {
  const errorId = useId();
  const field = `${inputClass} w-full min-w-0 tabular-nums aria-invalid:border-danger`;

  return (
    <Group legend={legend} hint={`${min} to ${max}`}>
      <div className="flex items-center gap-2">
        <input
          type="number"
          name={`min${name}`}
          aria-label={`Minimum ${legend.toLowerCase()}`}
          placeholder="Any"
          min={min}
          max={max}
          defaultValue={values.get(`min${name}`) ?? ""}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={field}
        />
        <span className="caption-2 text-muted">to</span>
        <input
          type="number"
          name={`max${name}`}
          aria-label={`Maximum ${legend.toLowerCase()}`}
          placeholder="Any"
          min={min}
          max={max}
          defaultValue={values.get(`max${name}`) ?? ""}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={field}
        />
      </div>
      {error && (
        <div id={errorId} className="mt-2">
          <InlineError>{error}</InlineError>
        </div>
      )}
    </Group>
  );
}
