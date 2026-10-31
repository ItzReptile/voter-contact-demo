"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { inputClass, secondaryButtonClass } from "@/components/ui";
import { assignListAction } from "./actions";

// A form posting to a Server Action: it works before (and without) client-side JavaScript.
export function AssignForm({
  listId,
  listName,
  volunteerId,
  volunteers,
  className = "",
}: {
  listId: number;
  listName: string;
  volunteerId: number | null;
  volunteers: { id: number; name: string }[];
  className?: string;
}) {
  const saved = volunteerId === null ? "" : String(volunteerId);
  // What the select shows, so the button knows whether there is anything to save.
  const [chosen, setChosen] = useState(saved);

  return (
    <form action={assignListAction} className={`flex min-w-0 items-center gap-2 ${className}`}>
      <input type="hidden" name="listId" value={listId} />
      {/* React resets a form after its action runs. The key remounts the select when the
          saved assignment changes, so it shows the new value instead of the old default. */}
      <select
        key={volunteerId ?? "none"}
        name="volunteerId"
        defaultValue={saved}
        onChange={(event) => setChosen(event.target.value)}
        aria-label={`Volunteer for ${listName}`}
        className={`${inputClass} min-w-0 flex-1 cursor-pointer`}
      >
        <option value="">Unassigned</option>
        {volunteers.map((volunteer) => (
          <option key={volunteer.id} value={volunteer.id}>
            {volunteer.name}
          </option>
        ))}
      </select>
      <AssignButton changed={chosen !== saved} unassigning={chosen === ""} assigned={saved !== ""} />
    </form>
  );
}

/**
 * Says what a click would do, and only works when the choice differs from what is saved:
 * "Assigned" after a save is the confirmation. A minimum width keeps the row from shifting.
 */
function AssignButton({ changed, unassigning, assigned }: { changed: boolean; unassigning: boolean; assigned: boolean }) {
  const { pending } = useFormStatus();
  const label = pending ? "Saving" : changed ? (unassigning ? "Unassign" : "Assign") : assigned ? "Assigned" : "Assign";
  return (
    <button type="submit" disabled={pending || !changed} className={`${secondaryButtonClass} min-w-24`}>
      {label}
    </button>
  );
}
