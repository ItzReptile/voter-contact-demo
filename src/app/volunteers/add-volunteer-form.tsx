"use client";

import { UserPlus, Warning } from "@phosphor-icons/react";
import { useActionState } from "react";
import { buttonClass, inputClass } from "@/components/ui";
import { addVolunteerAction, type AddVolunteerState } from "./actions";

export function AddVolunteerForm() {
  const [state, formAction, pending] = useActionState<AddVolunteerState, FormData>(addVolunteerAction, {
    savedCount: 0,
  });

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-0 flex-1 basis-64 flex-col gap-2 title-4 sm:flex-none">
        Name
        <input name="name" required maxLength={80} autoComplete="off" className={inputClass} />
      </label>
      <button type="submit" disabled={pending} className={buttonClass}>
        <UserPlus size={20} aria-hidden />
        Add volunteer
      </button>
      {state.error && (
        <p role="alert" className="flex w-full items-center gap-2 body-5 text-danger">
          <Warning size={20} aria-hidden />
          {state.error}
        </p>
      )}
    </form>
  );
}
