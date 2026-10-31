import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { freshTestDatabase, makeVoter } from "@/dev/fixtures";
import { logContact, undoContact } from "./contacts";
import { closePool, query, UserError } from "./db";
import { assignList, createList, getCanvassState } from "./lists";
import { segmentSchema } from "./segments";
import { addVolunteer } from "./volunteers";
import { importVoters } from "./voters";

beforeEach(freshTestDatabase);
afterAll(closePool);

describe("undoing a contact", () => {
  let listId: number;
  let voterId: number;

  beforeEach(async () => {
    await importVoters([makeVoter({ voterFileId: "A" }), makeVoter({ voterFileId: "B" })]);
    listId = await createList({ name: "Turf", kind: "door", segment: segmentSchema.parse({}) });
    await assignList(listId, await addVolunteer("Robin"));
    const rows = await query<{ id: number }>("select id from voters where voter_file_id = $1", ["A"]);
    voterId = rows[0].id;
  });

  it("removes a contact logged a moment ago, so the voter is next in the canvass view again", async () => {
    const contactId = await logContact({ listId, voterId, outcome: "not_home" });
    expect(await getCanvassState(listId)).toMatchObject({ next: { voter_file_id: "B" }, remaining: 1 });

    await undoContact(contactId);

    expect(await query("select * from contacts")).toEqual([]);
    expect(await getCanvassState(listId)).toMatchObject({ next: { id: voterId }, remaining: 2 });
  });

  it("refuses a contact logged more than 2 minutes ago", async () => {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    const contactId = await logContact({ listId, voterId, outcome: "reached", support: 2 }, { at: threeMinutesAgo });

    await expect(undoContact(contactId)).rejects.toThrow(UserError);
    expect(await query("select id from contacts")).toEqual([{ id: contactId }]);
  });
});
