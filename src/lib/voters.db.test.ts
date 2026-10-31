import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { freshTestDatabase, makeVoter } from "@/dev/fixtures";
import { closePool, query } from "./db";
import { DEFAULT_VOTER_FILTERS } from "./voter-filters";
import { countVoters, importVoters, listPrecincts, searchVoters } from "./voters";

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

describe("searchVoters", () => {
  beforeEach(async () => {
    await importVoters([
      makeVoter({ voterFileId: "A", firstName: "Ana", lastName: "Lopez", precinct: "P-01", party: "DEM", age: 30 }),
      makeVoter({ voterFileId: "B", firstName: "Ben", lastName: "Okafor", precinct: "P-01", party: "REP", age: 70 }),
      makeVoter({ voterFileId: "C", firstName: "Cara", lastName: "Nguyen", precinct: "P-02", party: "DEM", age: 50 }),
    ]);
  });

  const ids = (result: Awaited<ReturnType<typeof searchVoters>>) => result.rows.map((row) => row.voter_file_id);

  it("searches across first and last name", async () => {
    const result = await searchVoters({ ...DEFAULT_VOTER_FILTERS, q: "ana lop" });

    expect(result.total).toBe(1);
    expect(ids(result)).toEqual(["A"]);
  });

  it("combines precinct and party filters", async () => {
    expect(ids(await searchVoters({ ...DEFAULT_VOTER_FILTERS, precinct: "P-01", party: "DEM" }))).toEqual(["A"]);
  });

  it("sorts and pages", async () => {
    const byAge = await searchVoters({ ...DEFAULT_VOTER_FILTERS, sort: "age", dir: "desc", pageSize: 25 });
    expect(ids(byAge)).toEqual(["B", "C", "A"]);

    const secondPage = await searchVoters({ ...DEFAULT_VOTER_FILTERS, sort: "age", page: 2, pageSize: 2 });
    expect(secondPage.total).toBe(3);
    expect(ids(secondPage)).toEqual(["B"]);
  });

  it("treats a % in the search as text", async () => {
    expect((await searchVoters({ ...DEFAULT_VOTER_FILTERS, q: "%" })).total).toBe(0);
  });
});
