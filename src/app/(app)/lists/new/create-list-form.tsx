"use client";

import { Footprints } from "@phosphor-icons/react";
import { useActionState, useId } from "react";
import { buttonClass, InlineError, inputClass } from "@/components/ui";
import type { ListKind } from "@/lib/constants";
import { createListAction, type CreateListState } from "../actions";

export function CreateListForm({
  kind,
  segmentJson,
  suggestedName,
  disabled,
  note,
}: {
  kind: ListKind;
  segmentJson: string;
  suggestedName: string;
  disabled: boolean;
  /** Advice that doesn't block creating the list, e.g. a turf too big for one volunteer. */
  note?: string | null;
}) {
  const [state, formAction, pending] = useActionState<CreateListState, FormData>(createListAction, {});
  const noteId = useId();

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="segment" value={segmentJson} />
      {note && (
        <p id={noteId} className="flex items-start gap-2 rounded-md bg-soft px-3 py-2 body-6 text-ink-2">
          <Footprints size={16} aria-hidden className="mt-0.5 shrink-0" />
          <span>{note}</span>
        </p>
      )}
      <label className="flex min-w-0 flex-col gap-2">
        <span className="title-4">List name</span>
        {/* key: a new segment resets the suggested name */}
        <input
          key={suggestedName}
          name="name"
          defaultValue={suggestedName}
          required
          maxLength={120}
          disabled={disabled}
          className={`${inputClass} w-full`}
        />
      </label>
      <div>
        <button
          type="submit"
          disabled={disabled || pending}
          aria-describedby={note ? noteId : undefined}
          className={`${buttonClass} min-w-28`}
        >
          {pending ? "Creating" : "Create list"}
        </button>
      </div>
      {state.error && <InlineError>{state.error}</InlineError>}
    </form>
  );
}
