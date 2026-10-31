"use client";

import { Warning } from "@phosphor-icons/react";
import { useActionState, useState } from "react";
import { inputClass, smallButtonClass } from "@/components/ui";
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
      <ContactFields key={state.savedCount} disabled={disabled} pending={pending} />
      {state.status === "error" && (
        <p role="alert" className="flex w-full items-center gap-2 body-5 text-danger">
          <Warning size={20} aria-hidden />
          {state.message}
        </p>
      )}
    </form>
  );
}

function ContactFields({ disabled, pending }: { disabled: boolean; pending: boolean }) {
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
        disabled={disabled || pending}
        className={`${inputClass} min-w-0 flex-1 basis-40`}
      >
        {/* Not `disabled`: form.reset() picks the first enabled option, and this one must win.
            `required` on the select still blocks submitting it empty. */}
        <option value="">Outcome</option>
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
        disabled={disabled || pending || outcome !== "reached"}
        className={`${inputClass} min-w-0 flex-1 basis-40`}
      >
        <option value="">Support ID</option>
        {SUPPORT_LEVELS.map((level) => (
          <option key={level} value={level}>
            {level} · {SUPPORT_LABELS[level]}
          </option>
        ))}
      </select>
      <input
        name="notes"
        aria-label="Notes"
        placeholder="Notes"
        maxLength={500}
        disabled={disabled || pending}
        className={`${inputClass} min-w-0 flex-[2] basis-48`}
      />
      <button type="submit" disabled={disabled || pending} className={smallButtonClass}>
        {pending ? "Saving" : "Save"}
      </button>
    </>
  );
}
