"use client";

import { useActionState } from "react";
import { buttonClass, inputClass } from "@/components/ui";
import { addVolunteerAction, type AddVolunteerState } from "./actions";

export function AddVolunteerForm() {
  const [state, formAction, pending] = useActionState<AddVolunteerState, FormData>(addVolunteerAction, {
    savedCount: 0,
  });

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input name="name" required maxLength={80} className={inputClass} />
      </label>
      <button type="submit" disabled={pending} className={buttonClass}>
        Add volunteer
      </button>
      {state.error && (
        <p role="alert" className="w-full text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
