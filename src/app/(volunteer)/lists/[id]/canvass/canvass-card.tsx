"use client";

import { Phone, SkipForward } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { ghostButtonClass, Hanger, InlineError, inputClass, Tag } from "@/components/ui";
import { PARTY_LABELS, SUPPORT_LABELS, SUPPORT_LEVELS, type ListKind, type Party } from "@/lib/constants";
import { formatNumber, formatPhone } from "@/lib/format";
import { logCanvassAction, undoCanvassAction, type CanvassState } from "./actions";

type Voter = {
  id: number;
  name: string;
  position: number;
  address: string;
  precinct: string;
  phone: string | null;
  age: number;
  party: Party;
  score: number;
};

// Support IDs in the two inks: orange for support, indigo for oppose (the --support-N scale).
const SUPPORT_INK: Record<number, string> = {
  1: "bg-(--support-1) text-ink",
  2: "bg-(--support-2) text-ink",
  3: "bg-(--support-3) text-ink",
  4: "bg-(--support-4) text-ink",
  5: "bg-(--support-5) text-white",
};

// Short enough for five columns on a 320px phone. The full label is in each button's name.
const SUPPORT_SHORT_LABELS: Record<number, string> = {
  1: "Yes",
  2: "Lean yes",
  3: "Not sure",
  4: "Lean no",
  5: "No",
};

// Tapped hundreds of times a day: color changes are instant, the press is 0.97 over 150ms.
const press =
  "transition-transform duration-150 ease-out motion-safe:active:scale-97 disabled:cursor-not-allowed motion-safe:disabled:active:scale-100";

/**
 * One slot above the hanger reports both actions: a save, or the undo of it. If the request gets
 * no answer (no signal), the voter stays on screen with an error instead of the page going away.
 */
async function canvass(previous: CanvassState, formData: FormData): Promise<CanvassState> {
  const undo = formData.has("contactId");
  try {
    return await (undo ? undoCanvassAction(previous, formData) : logCanvassAction(previous, formData));
  } catch {
    return {
      status: "error",
      message: undo
        ? "The undo may not have gone through. Check your signal and try again."
        : "This tap may not have been saved. Check your signal and try again.",
    };
  }
}

/**
 * The volunteer's door hanger: one voter, printed in two inks, with boxes to tick.
 * Not home comes first because it is the most common tap. The orange strip opens the
 * conversation, where the support ID is recorded. Notes come last: they are optional,
 * and the keyboard they open should not cover the buttons.
 */
export function CanvassCard({ listId, kind, size, voter }: { listId: number; kind: ListKind; size: number; voter: Voter }) {
  const [state, formAction, pending] = useActionState<CanvassState, FormData>(canvass, { status: "idle" });
  const statusRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const supportLabel = useId();
  const hydrated = useHydrated();
  const door = kind === "door";

  // After a save or an undo another voter replaces this one. If the volunteer had scrolled down to
  // the notes, bring the confirmation and the new name back into view, and move focus to the new
  // name so keyboard and screen reader users land on it. An error only needs to be seen.
  useEffect(() => {
    if (state.status === "idle") return;
    if (state.status !== "error") nameRef.current?.focus({ preventScroll: true });
    statusRef.current?.scrollIntoView({ block: "nearest" });
  }, [state]);

  return (
    <div className="grid gap-3">
      {/* One slot above the hanger, two lines tall, so a save never shifts the buttons: a hint until
          the first save, then the confirmation. */}
      <div ref={statusRef} className="min-h-10 scroll-mt-24">
        <div className="flex items-start justify-between gap-4">
          <p role="status" className="flex min-w-0 items-start caption-2 text-muted">
            {state.status === "saved" || state.status === "undone" ? (
              <span
                key={state.message}
                className="flex min-w-0 items-start gap-2 body-5 text-ink transition-[opacity,translate] duration-200 ease-out starting:opacity-0 motion-safe:starting:translate-y-1"
              >
                <TickBox ticked={state.status === "saved"} reached={state.status === "saved" && state.reached} className="size-5" />
                <span className="min-w-0 break-words">{state.message}</span>
              </span>
            ) : state.status === "idle" ? (
              `One tap logs this ${door ? "door" : "call"} and brings up the next.`
            ) : null}
          </p>
          {state.status === "saved" && (
            // key: each save gets its own Undo, with its own clock.
            <UndoForm key={state.contactId} action={formAction} contactId={state.contactId} voterName={state.voterName} pending={pending} />
          )}
        </div>
        {state.status === "error" && <InlineError>{state.message}</InlineError>}
      </div>

      {/* @container: below 17rem (200% text, or a very small phone) the top row moves under the
          knob hole and the support IDs become a list. rem, so it follows the text size. */}
      <Hanger className="@container overflow-hidden">
        {/* key: a new voter gets a fresh form, so the notes field starts empty. */}
        <form key={voter.id} action={formAction} aria-label={`Log contact with ${voter.name}`} className="-mt-16 @max-[17rem]:mt-0">
          <input type="hidden" name="listId" value={listId} />
          <input type="hidden" name="voterId" value={voter.id} />
          <input type="hidden" name="voterName" value={voter.name} />

          {/* Printed either side of the knob hole. */}
          <div className="flex h-16 items-center justify-between gap-x-4 pr-2 pl-6 @max-[17rem]:h-auto @max-[17rem]:flex-wrap @max-[17rem]:pb-2">
            <p className="caption-1 text-muted tabular-nums">
              {door ? "Door" : "Call"} {formatNumber(voter.position)} of {formatNumber(size)}
            </p>
            <Link href={`/lists/${listId}/canvass?after=${voter.position}`} className={`${ghostButtonClass} ml-auto min-h-11`}>
              <SkipForward size={16} aria-hidden />
              Skip for now
            </Link>
          </div>

          {/* The next voter fades in over 150ms and the last one leaves at once. Not on page load. */}
          <div className={`bg-indigo px-6 py-6 text-white ${hydrated ? "transition-opacity duration-150 ease-out starting:opacity-0" : ""}`}>
            <h2 ref={nameRef} tabIndex={-1} className="heading-3 break-words outline-none">
              {voter.name}
            </h2>
            {door ? (
              <p className="mt-2 title-2 break-words">{voter.address}</p>
            ) : voter.phone ? (
              <a
                href={`tel:${voter.phone}`}
                className={`mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-paper px-4 py-3 button-md text-indigo-deep tabular-nums hover:bg-soft focus-visible:outline-white ${press}`}
              >
                <Phone size={20} weight="fill" aria-hidden />
                {formatPhone(voter.phone)}
              </a>
            ) : (
              <p className="mt-2 title-2">No phone number on file</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 px-6 pt-4">
            <Tag>{voter.precinct}</Tag>
            <Tag>Age {voter.age}</Tag>
            <Tag>{PARTY_LABELS[voter.party]}</Tag>
            <Tag tone="accent">Score {voter.score}</Tag>
          </div>

          <fieldset disabled={pending} className="min-w-0">
            {/* 16px apart, so a thumb that misses Not home lands on nothing. */}
            <div className="grid gap-4 px-6 pt-4">
              <TickButton value="not_home">{door ? "Not home" : "No answer"}</TickButton>
              <TickButton value={door ? "moved" : "wrong_number"}>{door ? "Moved" : "Wrong number"}</TickButton>
            </div>

            {/* Orange is the outcome that matters: everything under the strip is a conversation. */}
            <h3 className="mt-6 bg-orange px-6 py-2 title-4 text-ink">{door ? "They answered" : "They picked up"}</h3>

            {/* grid-cols-1: one track that can shrink. A textarea's own width (20 columns) would push it wider at 200% text. */}
            <div className="grid grid-cols-1 gap-6 px-6 pt-4 pb-6">
              <div role="group" aria-labelledby={supportLabel}>
                <p id={supportLabel} className="mb-2 title-4">
                  Their support
                </p>
                <div className="grid grid-cols-5 gap-2 @max-[17rem]:grid-cols-1">
                  {SUPPORT_LEVELS.map((level) => (
                    <SupportButton key={level} level={level} />
                  ))}
                </div>
              </div>

              <TickButton value="reached">Reached, no ID</TickButton>

              <NotesField />
            </div>
          </fieldset>
        </form>
      </Hanger>
    </div>
  );
}

const subscribeToNothing = () => () => {};

/** False while React hydrates the server's HTML, true for everything it renders after that. */
function useHydrated() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

/**
 * Controlled, so a failed save keeps what the volunteer typed (React resets uncontrolled fields
 * after a form action). The form's key gives each voter an empty field.
 */
function NotesField() {
  const [notes, setNotes] = useState("");
  return (
    <label className="grid gap-2">
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="title-4">Notes</span>
        <span className="caption-5 text-muted">Optional. Write them before you tap an outcome.</span>
      </span>
      <textarea
        name="notes"
        rows={2}
        maxLength={500}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Wants a yard sign"
        className={`${inputClass} h-auto w-full py-2 max-sm:h-auto`}
      />
    </label>
  );
}

// The server takes an undo for 2 minutes after a tap (undoContact). The button goes a little
// earlier, so a tap on it never arrives too late.
const UNDO_SECONDS = 110;

function UndoForm({
  action,
  contactId,
  voterName,
  pending,
}: {
  action: (formData: FormData) => void;
  contactId: number;
  voterName: string;
  pending: boolean;
}) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setOpen(false), UNDO_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, []);
  if (!open) return null;

  return (
    <form action={action} className="flex shrink-0">
      <input type="hidden" name="contactId" value={contactId} />
      <input type="hidden" name="voterName" value={voterName} />
      {/* 44px to tap, 20px in the layout, so the slot keeps its height. */}
      <button
        type="submit"
        disabled={pending}
        className={`-my-3 -mr-2 inline-flex min-h-11 items-center rounded-md px-2 button-sm text-indigo underline decoration-indigo/30 underline-offset-4 hover:decoration-indigo ${press}`}
      >
        Undo
      </button>
    </form>
  );
}

/** Which submit is waiting on the server, if any. Its box shows the tick right away. */
function useChoice(value: string) {
  const { pending, data } = useFormStatus();
  const chosen = pending && data?.get("choice") === value;
  return { chosen, waiting: pending && !chosen };
}

/** A row from the hanger: a printed box and a label. Tapping it ticks the box and logs the outcome. */
function TickButton({ value, children }: { value: string; children: ReactNode }) {
  const { chosen, waiting } = useChoice(value);
  return (
    <button
      type="submit"
      name="choice"
      value={value}
      className={`flex min-h-12 w-full items-center gap-3 rounded-xl border bg-paper px-4 py-3 text-left button-md text-ink ${press} ${
        chosen ? "border-ink" : "border-line hover:border-indigo"
      } ${waiting ? "opacity-40" : ""}`}
    >
      <TickBox ticked={chosen} reached={value === "reached"} className="size-6" />
      {children}
    </button>
  );
}

/**
 * A printed support box. The chosen one shows the tick in place of its label, so it never looks
 * like the focus ring (an indigo outline around the button).
 */
function SupportButton({ level }: { level: number }) {
  const { chosen, waiting } = useChoice(`reached:${level}`);
  return (
    <button
      type="submit"
      name="choice"
      value={`reached:${level}`}
      aria-label={`Reached, ${level} ${SUPPORT_LABELS[level]}`}
      className={`flex min-h-16 min-w-0 flex-col items-center gap-1 rounded-xl px-0 py-2 @max-[17rem]:min-h-12 @max-[17rem]:flex-row @max-[17rem]:gap-3 @max-[17rem]:px-4 ${SUPPORT_INK[level]} ${press} ${
        chosen ? "" : "hover:ring-2 hover:ring-ink/25 hover:ring-inset"
      } ${waiting ? "opacity-40" : ""}`}
    >
      <span className="heading-4 tabular-nums">{level}</span>
      {/* The tick prints over the label and keeps its space, so the row doesn't jump while saving. */}
      <span className="grid place-items-center">
        <span className={`col-start-1 row-start-1 text-center caption-4 ${chosen ? "invisible" : ""}`}>{SUPPORT_SHORT_LABELS[level]}</span>
        {chosen && <TickBox ticked reached className="col-start-1 row-start-1 size-4" />}
      </span>
    </button>
  );
}

/** The box printed on a door hanger, with the volunteer's pen tick: orange for a conversation, ink otherwise. */
function TickBox({ ticked, reached, className = "" }: { ticked: boolean; reached: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`shrink-0 ${className}`}>
      <rect x="1" y="1" width="22" height="22" rx="4" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
      {ticked && (
        <path
          d="M6 12.5l4.5 5L19 6"
          fill="none"
          stroke={reached ? "var(--orange)" : "var(--ink)"}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
