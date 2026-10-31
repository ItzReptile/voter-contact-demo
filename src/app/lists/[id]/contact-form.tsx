"use client";

import { useActionState, useState } from "react";
import { buttonClass, inputClass } from "@/components/ui";
import { OUTCOME_LABELS, OUTCOMES, SUPPORT_LABELS, SUPPORT_LEVELS } from "@/lib/constants";
import { logContactAction, type ContactFormState } from "../actions";

export function ContactForm({
  listId,
  voterId,
  voterName,
  disabled,
}: {
  listId: number;
  voterId: number;
  voterName: string;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState<ContactFormState, FormData>(logContactAction, {
    status: "idle",
    savedCount: 0,
  });

  return (
    <form action={formAction} aria-label={`Log contact with ${voterName}`} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="listId" value={listId} />
      <input type="hidden" name="voterId" value={voterId} />
      {/* A new key after each save clears the fields for the next attempt. */}
      <ContactFields key={state.savedCount} disabled={disabled || pending} />
      {state.status === "error" && (
        <p role="alert" className="w-full text-sm text-danger">
          {state.message}
        </p>
      )}
    </form>
  );
}

function ContactFields({ disabled }: { disabled: boolean }) {
  // Support is only asked for when the voter was reached (the server and database check this too).
  const [outcome, setOutcome] = useState("");

  return (
    <>
      <select
        name="outcome"
        aria-label="Outcome"
        required
        value={outcome}
        onChange={(event) => setOutcome(event.target.value)}
        disabled={disabled}
        className={inputClass}
      >
        {/* Not `disabled`: form.reset() picks the first enabled option, and this one must win.
            `required` on the select still blocks submitting it empty. */}
        <option value="">Outcome…</option>
        {OUTCOMES.map((value) => (
          <option key={value} value={value}>
            {OUTCOME_LABELS[value]}
          </option>
        ))}
      </select>
      <select
        name="support"
        aria-label="Support"
        defaultValue=""
        disabled={disabled || outcome !== "reached"}
        className={inputClass}
      >
        <option value="">Support…</option>
        {SUPPORT_LEVELS.map((level) => (
          <option key={level} value={level}>
            {level} · {SUPPORT_LABELS[level]}
          </option>
        ))}
      </select>
      <input name="notes" aria-label="Notes" placeholder="Notes" maxLength={500} disabled={disabled} className={`${inputClass} min-w-40 flex-1`} />
      <button type="submit" disabled={disabled} className={buttonClass}>
        Save
      </button>
    </>
  );
}
