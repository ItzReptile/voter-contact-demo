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
 * Records one attempt. It is credited to whoever the list is assigned to right now.
 * The database also rejects a voter who isn't on the list (composite foreign key).
 */
export async function logContact(input: ContactInput): Promise<void> {
  const lists = await query<{ volunteer_id: number | null }>("select volunteer_id from lists where id = $1", [
    input.listId,
  ]);
  if (lists.length === 0) throw new UserError("List not found.");
  if (lists[0].volunteer_id === null) {
    throw new UserError("Assign this list to a volunteer before logging contacts.");
  }

  await query(
    `insert into contacts (list_id, voter_id, volunteer_id, outcome, support, notes)
     values ($1, $2, $3, $4, $5, $6)`,
    [input.listId, input.voterId, lists[0].volunteer_id, input.outcome, input.support ?? null, input.notes ?? null],
  );
}
