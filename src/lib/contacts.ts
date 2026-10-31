import { z } from "zod";
import { OUTCOMES } from "./constants";
import { query, UserError } from "./db";

const blankToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

export const contactSchema = z
  .object({
    listId: z.coerce.number().int().positive(),
    voterId: z.coerce.number().int().positive(),
    outcome: z.enum(OUTCOMES, { error: "Choose an outcome" }),
    support: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(5).optional()),
    notes: z.preprocess(blankToUndefined, z.string().trim().max(500, "Notes are limited to 500 characters").optional()),
  })
  .refine((contact) => contact.support === undefined || contact.outcome === "reached", {
    message: "A support ID can only be recorded when the voter was reached",
    path: ["support"],
  });

export type ContactInput = z.infer<typeof contactSchema>;

/**
 * The canvass view logs a contact with one tap. Each button sends a choice:
 * "reached:1" to "reached:5" (a conversation with a support ID), "reached" (no ID),
 * "not_home", "moved" or "wrong_number". Returns null for anything else.
 */
export function parseCanvassChoice(choice: unknown): { outcome: (typeof OUTCOMES)[number]; support?: number } | null {
  if (typeof choice !== "string") return null;
  const match = choice.match(/^(reached|not_home|moved|wrong_number)(?::([1-5]))?$/);
  if (!match) return null;
  const [, outcome, support] = match;
  if (support && outcome !== "reached") return null;
  return { outcome: outcome as (typeof OUTCOMES)[number], ...(support ? { support: Number(support) } : {}) };
}

/**
 * Records one attempt. It is credited to whoever the list is assigned to right now.
 * The database also rejects a voter who isn't on the list (composite foreign key).
 * `at` backdates the attempt; the demo seed uses it, so the dashboard has a history.
 * Returns the new contact's id, so the canvass view can offer to undo it.
 */
export async function logContact(input: ContactInput, options: { at?: Date } = {}): Promise<number> {
  const lists = await query<{ volunteer_id: number | null }>("select volunteer_id from lists where id = $1", [
    input.listId,
  ]);
  if (lists.length === 0) throw new UserError("List not found.");
  if (lists[0].volunteer_id === null) {
    throw new UserError("Assign this list to a volunteer before logging contacts.");
  }

  const rows = await query<{ id: number }>(
    `insert into contacts (list_id, voter_id, volunteer_id, outcome, support, notes, created_at)
     values ($1, $2, $3, $4, $5, $6, coalesce($7, now()))
     returning id`,
    [
      input.listId,
      input.voterId,
      lists[0].volunteer_id,
      input.outcome,
      input.support ?? null,
      input.notes ?? null,
      options.at ?? null,
    ],
  );
  return rows[0].id;
}

/** How long a volunteer has to take back a mis-tap in the canvass view. */
const UNDO_MINUTES = 2;

/**
 * Takes back a contact logged by mistake, so the voter goes back on the canvass queue.
 * Only a fresh one: after a couple of minutes the attempt counts, whoever logged it.
 */
export async function undoContact(contactId: number): Promise<void> {
  const deleted = await query<{ id: number }>(
    "delete from contacts where id = $1 and created_at > now() - make_interval(mins => $2) returning id",
    [contactId, UNDO_MINUTES],
  );
  if (deleted.length === 0) {
    throw new UserError(`This attempt can't be undone. Undo only works for ${UNDO_MINUTES} minutes after a tap.`);
  }
}
