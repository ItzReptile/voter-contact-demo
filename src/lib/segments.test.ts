import { describe, expect, it } from "vitest";
import {
  buildSegmentWhere,
  describeSegment,
  parseSegmentParams,
  segmentSchema,
  suggestListName,
  type Segment,
} from "./segments";

const everyone: Segment = segmentSchema.parse({});

describe("parseSegmentParams", () => {
  it("treats an empty query as everyone", () => {
    expect(parseSegmentParams(new URLSearchParams())).toEqual({ ok: true, segment: everyone });
  });

  it("reads repeated precinct and party params and blank numbers as no filter", () => {
    const params = new URLSearchParams("precinct=P-01&precinct=P-02&party=DEM&minAge=&maxAge=40&contact=not_reached");

    expect(parseSegmentParams(params)).toEqual({
      ok: true,
      segment: {
        precincts: ["P-01", "P-02"],
        parties: ["DEM"],
        maxAge: 40,
        contact: "not_reached",
      },
    });
  });

  it("rejects a minimum above the maximum", () => {
    const result = parseSegmentParams(new URLSearchParams("minScore=80&maxScore=20"));

    expect(result).toEqual({ ok: false, error: "Minimum score is above maximum score" });
  });

  it("rejects an unknown party", () => {
    expect(parseSegmentParams(new URLSearchParams("party=XYZ")).ok).toBe(false);
  });
});

describe("buildSegmentWhere", () => {
  it("matches every voter for an empty door segment", () => {
    expect(buildSegmentWhere(everyone, "door")).toEqual({ where: "true", params: [] });
  });

  it("requires a phone number for phone lists", () => {
    expect(buildSegmentWhere(everyone, "phone")).toEqual({ where: "v.phone is not null", params: [] });
  });

  it("numbers placeholders in order and keeps values out of the SQL", () => {
    const segment: Segment = {
      precincts: ["P-03"],
      parties: ["DEM", "NPA"],
      minAge: 18,
      maxAge: 34,
      minScore: 40,
      maxScore: 60,
      contact: "any",
    };

    expect(buildSegmentWhere(segment, "door")).toEqual({
      where:
        "v.precinct = any($1) and v.party = any($2) and v.age >= $3 and v.age <= $4" +
        " and v.support_score >= $5 and v.support_score <= $6",
      params: [["P-03"], ["DEM", "NPA"], 18, 34, 40, 60],
    });
  });

  it("does not inject a precinct name into the SQL", () => {
    const segment: Segment = { ...everyone, precincts: ["P-01'; drop table voters; --"] };

    const { where, params } = buildSegmentWhere(segment, "door");

    expect(where).toBe("v.precinct = any($1)");
    expect(params).toEqual([["P-01'; drop table voters; --"]]);
  });

  it("excludes anyone with an attempt for never_attempted", () => {
    const { where } = buildSegmentWhere({ ...everyone, contact: "never_attempted" }, "door");

    expect(where).toBe("not exists (select 1 from contacts c where c.voter_id = v.id)");
  });

  it("excludes only conversations for not_reached, so not-homes get another try", () => {
    const { where } = buildSegmentWhere({ ...everyone, contact: "not_reached" }, "door");

    expect(where).toContain("c.outcome = 'reached'");
  });
});

describe("describeSegment and suggestListName", () => {
  it("describes everyone", () => {
    expect(describeSegment(everyone)).toBe("All precincts");
  });

  it("describes each filter", () => {
    const segment: Segment = {
      precincts: ["P-03", "P-04"],
      parties: ["DEM"],
      minAge: 65,
      minScore: 40,
      maxScore: 60,
      contact: "not_reached",
    };

    expect(describeSegment(segment)).toBe("P-03, P-04 · Democratic · age 65+ · score 40 to 60 · not yet reached");
    expect(suggestListName(segment, "phone")).toBe(
      "Calls · P-03, P-04 · Democratic · age 65+ · score 40 to 60 · not yet reached",
    );
  });
});
