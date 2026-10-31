import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { freshTestDatabase, makeVoter } from "@/dev/fixtures";
import { closePool, query } from "./db";
import { countVoters, importVoters, listPrecincts } from "./voters";

beforeEach(freshTestDatabase);
afterAll(closePool);

describe("importVoters", () => {
  it("inserts new voters", async () => {
    const result = await importVoters([makeVoter(), makeVoter({ precinct: "P-02" })]);

    expect(result).toEqual({ inserted: 2, updated: 0 });
    expect(await countVoters()).toBe(2);
    expect(await listPrecincts()).toEqual(["P-01", "P-02"]);
  });

  it("updates voters already in the file instead of duplicating them", async () => {
    const original = makeVoter({ voterFileId: "V1", supportScore: 40 });
    await importVoters([original]);

    const result = await importVoters([{ ...original, supportScore: 90 }, makeVoter()]);

    expect(result).toEqual({ inserted: 1, updated: 1 });
    const rows = await query<{ support_score: number }>(
      "select support_score from voters where voter_file_id = 'V1'",
    );
    expect(rows).toEqual([{ support_score: 90 }]);
  });

  it("stores the parsed house number and street for walk order", async () => {
    await importVoters([makeVoter({ address: "12B Elm St" })]);

    const rows = await query("select house_number, street from voters");
    expect(rows).toEqual([{ house_number: 12, street: "Elm St" }]);
  });

  it("does nothing for an empty file", async () => {
    expect(await importVoters([])).toEqual({ inserted: 0, updated: 0 });
  });
});
