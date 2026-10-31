"use client";

import { useActionState } from "react";
import { buttonClass, InlineError, inputClass } from "@/components/ui";
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
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="segment" value={segmentJson} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-0 flex-1 basis-64 flex-col gap-2">
          <span className="title-4">List name</span>
          {/* key: a new segment resets the suggested name */}
          <input key={suggestedName} name="name" defaultValue={suggestedName} required maxLength={120} className={inputClass} />
        </label>
        <button type="submit" disabled={disabled || pending} className={buttonClass}>
          {pending ? "Creating" : "Create list"}
        </button>
      </div>
      {state.error && <InlineError>{state.error}</InlineError>}
    </form>
  );
}
