"use client";

import { UserPlus } from "@phosphor-icons/react";
import { useActionState } from "react";
import { buttonClass, InlineError, inputClass } from "@/components/ui";
import { addVolunteerAction, type AddVolunteerState } from "./actions";

export function AddVolunteerForm() {
  const [state, formAction, pending] = useActionState<AddVolunteerState, FormData>(addVolunteerAction, {
    savedCount: 0,
  });

  return (
    <form action={formAction} className="grid max-w-xl gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-0 flex-1 basis-64 flex-col gap-2">
          <span className="title-4">Name</span>
          <input name="name" required maxLength={80} autoComplete="off" placeholder="Full name" className={`${inputClass} min-h-11`} />
        </label>
        <button type="submit" disabled={pending} className={`${buttonClass} min-h-11`}>
          <UserPlus size={16} aria-hidden />
          Add volunteer
        </button>
      </div>
      {state.error && <InlineError>{state.error}</InlineError>}
    </form>
  );
}
