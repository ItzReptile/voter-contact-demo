"use client";

import { useActionState } from "react";
import { buttonClass, inputClass } from "@/components/ui";
import type { ListKind } from "@/lib/constants";
import { createListAction, type CreateListState } from "../actions";

export function CreateListForm({
  kind,
  segmentJson,
  suggestedName,
  disabled,
}: {
  kind: ListKind;
  segmentJson: string;
  suggestedName: string;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState<CreateListState, FormData>(createListAction, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="segment" value={segmentJson} />
      <label className="flex min-w-72 flex-1 flex-col gap-1 text-sm">
        List name
        {/* key: a new segment resets the suggested name */}
        <input key={suggestedName} name="name" defaultValue={suggestedName} required className={inputClass} />
      </label>
      <button type="submit" disabled={disabled || pending} className={buttonClass}>
        {pending ? "Creating…" : "Create list"}
      </button>
      {state.error && (
        <p role="alert" className="w-full text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
