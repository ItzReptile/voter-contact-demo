"use client";

import { CheckCircle, DoorOpen, PhoneCall, PhoneSlash, SkipForward } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState } from "react";
import { InlineError, inputClass, Tag } from "@/components/ui";
import { PARTY_LABELS, SUPPORT_LABELS, SUPPORT_LEVELS, type ListKind, type Party } from "@/lib/constants";
import { formatPhone } from "@/lib/format";
import { logCanvassAction, type CanvassState } from "../../actions";

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

// Support buttons: indigo for support, gray for undecided, plum for oppose (same scale as the dashboard).
const SUPPORT_STYLES: Record<number, string> = {
  1: "border-accent bg-accent text-white hover:bg-accent-hover",
  2: "border-accent/40 bg-accent-tint text-accent-ink hover:border-accent",
  3: "border-line bg-subtle text-ink hover:border-faint",
  4: "border-plum/40 bg-plum-tint text-plum-ink hover:border-plum",
  5: "border-plum bg-plum text-white hover:opacity-90",
};

const tap = "transition motion-safe:active:scale-98 disabled:cursor-not-allowed disabled:opacity-50";

export function CanvassCard({ listId, kind, size, voter }: { listId: number; kind: ListKind; size: number; voter: Voter }) {
  const [state, formAction, pending] = useActionState<CanvassState, FormData>(logCanvassAction, { status: "idle" });

  return (
    <div className="grid gap-4">
      {state.status === "saved" && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-teal-tint px-3 py-2 body-5 text-teal-ink">
          <CheckCircle size={18} weight="fill" aria-hidden />
          {state.message}
        </p>
      )}

      {/* key: a new voter gets a fresh form, so the notes field starts empty. */}
      <form key={voter.id} action={formAction} aria-label={`Log contact with ${voter.name}`} className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-6">
        <input type="hidden" name="listId" value={listId} />
        <input type="hidden" name="voterId" value={voter.id} />
        <input type="hidden" name="voterName" value={voter.name} />

        <p className="caption-1 text-muted tabular-nums">
          {kind === "door" ? "Door" : "Call"} {voter.position} of {size}
        </p>
        <h2 className="mt-1 heading-4">{voter.name}</h2>
        {kind === "door" ? (
          <p className="mt-2 flex items-center gap-2 title-2 text-ink-2">
            <DoorOpen size={20} aria-hidden className="text-accent" />
            {voter.address}
          </p>
        ) : (
          <a href={`tel:${voter.phone}`} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent-tint px-3 py-2 title-2 text-accent-ink transition hover:bg-accent hover:text-white">
            <PhoneCall size={20} aria-hidden />
            {formatPhone(voter.phone)}
          </a>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Tag dot={false}>{voter.precinct}</Tag>
          <Tag dot={false}>Age {voter.age}</Tag>
          <Tag dot={false}>{PARTY_LABELS[voter.party]}</Tag>
          <Tag tone="accent">Score {voter.score}</Tag>
        </div>

        <fieldset className="mt-6" disabled={pending}>
          <legend className="mb-3 title-4">Reached: what&apos;s their support?</legend>
          <div className="grid grid-cols-5 gap-2">
            {SUPPORT_LEVELS.map((level) => (
              <button
                key={level}
                type="submit"
                name="choice"
                value={`reached:${level}`}
                aria-label={`Reached, ${level} ${SUPPORT_LABELS[level]}`}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 ${tap} ${SUPPORT_STYLES[level]}`}
              >
                <span className="heading-6 tabular-nums">{level}</span>
                <span className="hidden text-center caption-5 sm:block">{SUPPORT_LABELS[level]}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 flex justify-between caption-5 text-muted sm:hidden" aria-hidden>
            <span>1 strong support</span>
            <span>5 strong oppose</span>
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button type="submit" name="choice" value="reached" className={`min-h-12 rounded-xl border border-line bg-surface px-2 py-2 button-sm hover:bg-hover ${tap}`}>
              Reached, no ID
            </button>
            <button type="submit" name="choice" value="not_home" className={`min-h-12 rounded-xl border border-orange/40 bg-orange-tint px-2 py-2 button-sm text-orange-ink hover:border-orange ${tap}`}>
              {kind === "door" ? "Not home" : "No answer"}
            </button>
            <button type="submit" name="choice" value="wrong_number" className={`inline-flex min-h-12 items-center justify-center gap-1 rounded-xl border border-line bg-surface px-2 py-2 button-sm hover:bg-hover ${tap}`}>
              {kind === "phone" && <PhoneSlash size={16} aria-hidden />}
              {kind === "door" ? "Moved" : "Wrong number"}
            </button>
          </div>

          <label className="mt-4 grid gap-2">
            <span className="title-4">
              Notes <span className="caption-5 text-faint">optional, saved with the outcome</span>
            </span>
            <textarea name="notes" rows={2} maxLength={500} placeholder="Wants a yard sign" className={`${inputClass} h-auto py-2`} />
          </label>
        </fieldset>

        {state.status === "error" && (
          <div className="mt-4">
            <InlineError>{state.message}</InlineError>
          </div>
        )}
      </form>

      <Link
        href={`/lists/${listId}/canvass?after=${voter.position}`}
        className="inline-flex items-center justify-center gap-2 self-center rounded-lg px-3 py-2 button-sm text-muted transition hover:bg-hover hover:text-ink"
      >
        <SkipForward size={16} aria-hidden />
        Skip for now
      </Link>
    </div>
  );
}
