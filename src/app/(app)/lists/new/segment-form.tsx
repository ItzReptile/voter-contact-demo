"use client";

import { DoorOpen, Phone } from "@phosphor-icons/react";
import { useRef, type FormEvent, type ReactNode } from "react";
import { inputClass, secondaryButtonClass } from "@/components/ui";
import { useFilterNavigation } from "@/components/url-filters";
import { CONTACT_FILTER_LABELS, CONTACT_FILTERS, PARTIES, PARTY_LABELS, type ListKind } from "@/lib/constants";

/**
 * The segment filters. Every change updates the URL (debounced), and the server renders the
 * new count and preview. Without JavaScript, the Preview button submits the same GET form.
 */
export function SegmentForm({
  kind,
  query,
  precincts,
}: {
  kind: ListKind;
  query: string;
  precincts: string[];
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
      className="grid gap-6 rounded-xl border border-line bg-surface p-4 sm:p-6 lg:sticky lg:top-6"
    >
      <Group legend="List type">
        <div className="grid grid-cols-2 gap-2">
          <KindOption value="door" checked={kind === "door"} icon={<DoorOpen size={20} aria-hidden />} title="Door knocking" detail="Walk order" />
          <KindOption value="phone" checked={kind === "phone"} icon={<Phone size={20} aria-hidden />} title="Phone calls" detail="Has a phone" />
        </div>
      </Group>

      <Group legend="Precincts" hint="None selected means all">
        <div className="flex flex-wrap gap-2">
          {precincts.map((precinct) => (
            <Chip key={precinct} name="precinct" value={precinct} defaultChecked={checked("precinct", precinct)}>
              {precinct}
            </Chip>
          ))}
        </div>
      </Group>

      <Group legend="Party" hint="None selected means all">
        <div className="flex flex-wrap gap-2">
          {PARTIES.map((party) => (
            <Chip key={party} name="party" value={party} defaultChecked={checked("party", party)}>
              {PARTY_LABELS[party]}
            </Chip>
          ))}
        </div>
      </Group>

      <Range legend="Age" name="Age" min={18} max={120} values={values} />
      <Range legend="Support score" name="Score" min={0} max={100} values={values} />

      <label className="grid gap-2">
        <span className="title-4">Contact history</span>
        <select name="contact" defaultValue={values.get("contact") ?? "any"} className={inputClass}>
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
    </form>
  );
}

function Group({ legend, hint, children }: { legend: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 flex w-full items-baseline justify-between gap-2">
        <span className="title-4">{legend}</span>
        {hint && <span className="caption-5 text-faint">{hint}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

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
    <label className="flex cursor-pointer flex-col gap-2 rounded-lg border border-line p-3 transition hover:bg-hover has-[:checked]:border-accent has-[:checked]:bg-accent-tint has-[:checked]:text-accent-ink">
      <span className="flex items-center justify-between">
        {icon}
        <input type="radio" name="kind" value={value} defaultChecked={checked} className="accent-accent" />
      </span>
      <span className="title-4">{title}</span>
      <span className="caption-5 text-muted">{detail}</span>
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
    <label className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1 caption-1 transition hover:bg-hover has-[:checked]:border-accent has-[:checked]:bg-accent-tint has-[:checked]:text-accent-ink">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="accent-accent" />
      {children}
    </label>
  );
}

function Range({
  legend,
  name,
  min,
  max,
  values,
}: {
  legend: string;
  name: string;
  min: number;
  max: number;
  values: URLSearchParams;
}) {
  return (
    <fieldset>
      <legend className="mb-3 title-4">{legend}</legend>
      <div className="flex items-center gap-2">
        <input
          type="number"
          name={`min${name}`}
          aria-label={`Minimum ${legend.toLowerCase()}`}
          placeholder={`${min}`}
          min={min}
          max={max}
          defaultValue={values.get(`min${name}`) ?? ""}
          className={`${inputClass} w-full min-w-0`}
        />
        <span className="caption-2 text-muted">to</span>
        <input
          type="number"
          name={`max${name}`}
          aria-label={`Maximum ${legend.toLowerCase()}`}
          placeholder={`${max}`}
          min={min}
          max={max}
          defaultValue={values.get(`max${name}`) ?? ""}
          className={`${inputClass} w-full min-w-0`}
        />
      </div>
    </fieldset>
  );
}
