import { inputClass, secondaryButtonClass } from "@/components/ui";
import { assignListAction } from "./actions";

// A plain form posting to a Server Action: works without any client-side JavaScript.
export function AssignForm({
  listId,
  listName,
  volunteerId,
  volunteers,
}: {
  listId: number;
  listName: string;
  volunteerId: number | null;
  volunteers: { id: number; name: string }[];
}) {
  return (
    <form action={assignListAction} className="flex items-center gap-2">
      <input type="hidden" name="listId" value={listId} />
      {/* React resets a form after its action runs. The key remounts the select when the
          saved assignment changes, so it shows the new value instead of the old default. */}
      <select
        key={volunteerId ?? "none"}
        name="volunteerId"
        defaultValue={volunteerId ?? ""}
        aria-label={`Volunteer for ${listName}`}
        className={`${inputClass} min-w-40`}
      >
        <option value="">Unassigned</option>
        {volunteers.map((volunteer) => (
          <option key={volunteer.id} value={volunteer.id}>
            {volunteer.name}
          </option>
        ))}
      </select>
      <button type="submit" className={secondaryButtonClass}>
        Assign
      </button>
    </form>
  );
}
