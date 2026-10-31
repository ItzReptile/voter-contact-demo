import { DatabaseError } from "pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { freshTestDatabase, makeVoter } from "@/dev/fixtures";
import { logContact } from "./contacts";
import { getAttemptsByDay, getOutcomeCounts, getPrecinctStats, getTotals } from "./dashboard";
import { closePool, query, UserError } from "./db";
import { assignList, createList, getCanvassState, getListSummary, getListVoters, previewSegment } from "./lists";
import { segmentSchema } from "./segments";
import { addVolunteer } from "./volunteers";
import { importVoters } from "./voters";

beforeEach(freshTestDatabase);
afterAll(closePool);

const everyone = segmentSchema.parse({});

async function voterId(voterFileId: string): Promise<number> {
  const rows = await query<{ id: number }>("select id from voters where voter_file_id = $1", [voterFileId]);
  return rows[0].id;
}

describe("segments and lists", () => {
  beforeEach(async () => {
    await importVoters([
      makeVoter({ voterFileId: "A", precinct: "P-01", address: "22 Birch St", age: 25, supportScore: 80 }),
      makeVoter({ voterFileId: "B", precinct: "P-01", address: "5 Aspen Ct", age: 70, supportScore: 50 }),
      makeVoter({ voterFileId: "C", precinct: "P-01", address: "10 Birch St", age: 45, supportScore: 55, phone: null }),
      makeVoter({ voterFileId: "D", precinct: "P-02", address: "1 Main St", age: 33, supportScore: 10 }),
    ]);
  });

  it("previews how many voters a segment matches", async () => {
    const segment = { ...everyone, precincts: ["P-01"], minScore: 50 };

    const preview = await previewSegment(segment, "door");

    expect(preview.count).toBe(3);
    expect(preview.sample.map((voter) => voter.voter_file_id)).toEqual(["B", "C", "A"]);
  });

  it("puts door lists in walk order: street, then house number", async () => {
    const listId = await createList({ name: "Turf", kind: "door", segment: { ...everyone, precincts: ["P-01"] } });

    const voters = await getListVoters(listId);
    expect(voters.map((voter) => [voter.position, voter.address])).toEqual([
      [1, "5 Aspen Ct"],
      [2, "10 Birch St"],
      [3, "22 Birch St"],
    ]);
  });

  it("leaves voters without a phone off phone lists", async () => {
    const listId = await createList({ name: "Calls", kind: "phone", segment: { ...everyone, precincts: ["P-01"] } });

    const voters = await getListVoters(listId);
    expect(voters.map((voter) => voter.voter_file_id).sort()).toEqual(["A", "B"]);
  });

  it("refuses to create an empty list", async () => {
    const segment = { ...everyone, precincts: ["P-99"] };

    await expect(createList({ name: "Empty", kind: "door", segment })).rejects.toThrow(UserError);
    expect(await query("select * from lists")).toEqual([]);
  });

  it("keeps list membership fixed when the voter file changes", async () => {
    const listId = await createList({ name: "Turf", kind: "door", segment: { ...everyone, precincts: ["P-02"] } });

    await importVoters([makeVoter({ voterFileId: "E", precinct: "P-02" })]);

    expect((await getListVoters(listId)).map((voter) => voter.voter_file_id)).toEqual(["D"]);
  });

  it("filters out voters already reached, but not ones who weren't home", async () => {
    const volunteer = await addVolunteer("Robin");
    const listId = await createList({ name: "Turf", kind: "door", segment: { ...everyone, precincts: ["P-01"] } });
    await assignList(listId, volunteer);
    await logContact({ listId, voterId: await voterId("A"), outcome: "reached", support: 1 });
    await logContact({ listId, voterId: await voterId("B"), outcome: "not_home" });

    const notReached = await previewSegment({ ...everyone, precincts: ["P-01"], contact: "not_reached" }, "door");
    const neverTried = await previewSegment({ ...everyone, precincts: ["P-01"], contact: "never_attempted" }, "door");

    expect(notReached.sample.map((voter) => voter.voter_file_id)).toEqual(["B", "C"]);
    expect(neverTried.sample.map((voter) => voter.voter_file_id)).toEqual(["C"]);
  });
});

describe("logging contacts", () => {
  let listId: number;

  beforeEach(async () => {
    await importVoters([
      makeVoter({ voterFileId: "A", precinct: "P-01" }),
      makeVoter({ voterFileId: "B", precinct: "P-01" }),
      makeVoter({ voterFileId: "OFF", precinct: "P-02" }),
    ]);
    listId = await createList({ name: "Turf", kind: "door", segment: { ...everyone, precincts: ["P-01"] } });
  });

  it("requires the list to be assigned first", async () => {
    await expect(logContact({ listId, voterId: await voterId("A"), outcome: "not_home" })).rejects.toThrow(
      "Assign this list to a volunteer before logging contacts.",
    );
  });

  it("credits the attempt to the assigned volunteer and shows the latest outcome", async () => {
    const volunteer = await addVolunteer("Robin");
    await assignList(listId, volunteer);
    const a = await voterId("A");

    await logContact({ listId, voterId: a, outcome: "not_home" });
    await logContact({ listId, voterId: a, outcome: "reached", support: 2, notes: "Wants a yard sign" });

    const [first] = await getListVoters(listId);
    expect(first).toMatchObject({
      voter_file_id: "A",
      attempts: 2,
      last_outcome: "reached",
      last_support: 2,
      last_notes: "Wants a yard sign",
    });
    const credited = await query("select distinct volunteer_id from contacts");
    expect(credited).toEqual([{ volunteer_id: volunteer }]);
  });

  it("gives the canvass view the next voter not yet attempted, and supports skipping", async () => {
    await assignList(listId, await addVolunteer("Robin"));
    const [a, b] = [await voterId("A"), await voterId("B")];

    expect(await getCanvassState(listId)).toMatchObject({ next: { id: a, position: 1 }, remaining: 2 });
    expect(await getCanvassState(listId, 1)).toMatchObject({ next: { id: b, position: 2 }, remaining: 2 });

    await logContact({ listId, voterId: a, outcome: "not_home" });
    expect(await getCanvassState(listId)).toMatchObject({ next: { id: b }, remaining: 1 });

    await logContact({ listId, voterId: b, outcome: "reached", support: 3 });
    expect(await getCanvassState(listId)).toEqual({ next: null, remaining: 0 });
  });

  it("hides reached voters when asked for remaining only", async () => {
    await assignList(listId, await addVolunteer("Robin"));
    await logContact({ listId, voterId: await voterId("A"), outcome: "reached" });

    const remaining = await getListVoters(listId, { remainingOnly: true });

    expect(remaining.map((voter) => voter.voter_file_id)).toEqual(["B"]);
  });

  it("rejects a voter who is not on the list (database foreign key)", async () => {
    await assignList(listId, await addVolunteer("Robin"));

    const attempt = logContact({ listId, voterId: await voterId("OFF"), outcome: "reached" });

    await expect(attempt).rejects.toThrow(DatabaseError);
  });

  it("rejects a support ID without a conversation (database check)", async () => {
    await assignList(listId, await addVolunteer("Robin"));

    const attempt = logContact({ listId, voterId: await voterId("A"), outcome: "not_home", support: 1 });

    await expect(attempt).rejects.toThrow(DatabaseError);
  });
});

describe("dashboard", () => {
  it("counts attempts, conversations and supporters by precinct and list", async () => {
    await importVoters([
      makeVoter({ voterFileId: "A", precinct: "P-01" }),
      makeVoter({ voterFileId: "B", precinct: "P-01" }),
      makeVoter({ voterFileId: "C", precinct: "P-02" }),
    ]);
    const listId = await createList({ name: "All", kind: "door", segment: everyone });
    await assignList(listId, await addVolunteer("Robin"));
    const [a, b] = [await voterId("A"), await voterId("B")];
    await logContact({ listId, voterId: a, outcome: "not_home" });
    await logContact({ listId, voterId: a, outcome: "reached", support: 1 });
    await logContact({ listId, voterId: b, outcome: "wrong_number" });

    expect(await getTotals()).toEqual({
      voters: 3,
      voters_on_lists: 3,
      attempts: 3,
      conversations: 1,
      supporters: 1,
    });
    expect(await getOutcomeCounts()).toEqual({ reached: 1, not_home: 1, wrong_number: 1 });
    expect(await getPrecinctStats()).toEqual([
      { precinct: "P-01", voters: 2, voters_attempted: 2, attempts: 3, conversations: 1, supporters: 1 },
      { precinct: "P-02", voters: 1, voters_attempted: 0, attempts: 0, conversations: 0, supporters: 0 },
    ]);
    expect(await getListSummary(listId)).toMatchObject({
      size: 3,
      voters_attempted: 2,
      attempts: 3,
      conversations: 1,
      volunteer_name: "Robin",
    });
  });

  it("counts attempts per day, with empty days included", async () => {
    await importVoters([makeVoter({ voterFileId: "A" })]);
    const listId = await createList({ name: "All", kind: "door", segment: everyone });
    await assignList(listId, await addVolunteer("Robin"));
    const a = await voterId("A");
    const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
    await logContact({ listId, voterId: a, outcome: "not_home" }, { at: daysAgo(2) });
    await logContact({ listId, voterId: a, outcome: "not_home" }, { at: daysAgo(2) });
    await logContact({ listId, voterId: a, outcome: "reached" });

    const days = await getAttemptsByDay(7);

    expect(days).toHaveLength(7);
    expect(days[4]).toMatchObject({ reached: 0, not_home: 2, wrong_number: 0 });
    expect(days[6]).toMatchObject({ reached: 1, not_home: 0, wrong_number: 0 });
    expect(days.slice(0, 4).every((day) => day.reached + day.not_home + day.wrong_number === 0)).toBe(true);
  });
});
