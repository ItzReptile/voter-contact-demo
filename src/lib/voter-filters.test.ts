import { describe, expect, it } from "vitest";
import {
  buildVoterWhere,
  DEFAULT_VOTER_FILTERS,
  escapeLike,
  parseVoterFilters,
  voterFiltersHref,
  voterOrderBy,
} from "./voter-filters";

describe("parseVoterFilters", () => {
  it("uses the defaults for an empty URL", () => {
    expect(parseVoterFilters(new URLSearchParams())).toEqual(DEFAULT_VOTER_FILTERS);
  });

  it("reads every filter", () => {
    const params = new URLSearchParams("q=Lopez&precinct=P-03&party=dem&sort=score&dir=desc&page=3&size=50");

    expect(parseVoterFilters(params)).toEqual({
      q: "Lopez",
      precinct: "P-03",
      party: "DEM",
      sort: "score",
      dir: "desc",
      page: 3,
      pageSize: 50,
    });
  });

  it("falls back on values it doesn't know instead of passing them to SQL", () => {
    const params = new URLSearchParams("sort=v.id;drop table voters&dir=sideways&party=XYZ&page=-4&size=7");

    expect(parseVoterFilters(params)).toMatchObject({ sort: "name", dir: "asc", party: "", page: 1, pageSize: 25 });
  });
});

describe("buildVoterWhere", () => {
  it("matches everyone with no filters", () => {
    expect(buildVoterWhere(DEFAULT_VOTER_FILTERS)).toEqual({ where: "true", params: [] });
  });

  it("searches name, address and voter ID with one escaped parameter", () => {
    const { where, params } = buildVoterWhere({ ...DEFAULT_VOTER_FILTERS, q: "50%_off", precinct: "P-01", party: "REP" });

    expect(where).toBe(
      "(v.first_name || ' ' || v.last_name ilike $1 or v.address ilike $1 or v.voter_file_id ilike $1)" +
        " and v.precinct = $2 and v.party = $3",
    );
    expect(params).toEqual(["%50\\%\\_off%", "P-01", "REP"]);
  });
});

describe("escapeLike", () => {
  it("escapes the LIKE wildcards and the escape character", () => {
    expect(escapeLike("a%b_c\\d")).toBe("a\\%b\\_c\\\\d");
  });
});

describe("voterOrderBy", () => {
  it("applies the direction to every column and breaks ties by id", () => {
    expect(voterOrderBy({ ...DEFAULT_VOTER_FILTERS, sort: "name", dir: "desc" })).toBe(
      "v.last_name desc, v.first_name desc, v.id",
    );
  });
});

describe("voterFiltersHref", () => {
  it("keeps the URL short for the defaults", () => {
    expect(voterFiltersHref(DEFAULT_VOTER_FILTERS, {})).toBe("/voters");
  });

  it("goes back to page 1 when a filter changes", () => {
    const current = { ...DEFAULT_VOTER_FILTERS, page: 4, precinct: "P-02" };

    expect(voterFiltersHref(current, { sort: "age", dir: "desc" })).toBe("/voters?precinct=P-02&sort=age&dir=desc");
  });

  it("keeps the other filters when changing page", () => {
    expect(voterFiltersHref({ ...DEFAULT_VOTER_FILTERS, q: "Ana" }, { page: 2 })).toBe("/voters?q=Ana&page=2");
  });
});
