import { describe, expect, it } from "vitest";
import { normalizePhone, parseVoterCsv, splitAddress } from "./csv";

const HEADER = "voter_id,first_name,last_name,address,city,zip,precinct,age,party,phone,support_score";

function csv(...rows: string[]): string {
  return [HEADER, ...rows].join("\n");
}

describe("splitAddress", () => {
  it("splits the house number from the street", () => {
    expect(splitAddress("412 Maple Ave")).toEqual({ houseNumber: 412, street: "Maple Ave" });
  });

  it("drops a letter suffix on the house number", () => {
    expect(splitAddress("12B Oak St")).toEqual({ houseNumber: 12, street: "Oak St" });
  });

  it("keeps the whole address as the street when there is no number", () => {
    expect(splitAddress("Rural Route 2")).toEqual({ houseNumber: null, street: "Rural Route 2" });
  });
});

describe("normalizePhone", () => {
  it.each([
    ["(555) 234-5678", "5552345678"],
    ["555.234.5678", "5552345678"],
    ["+1 555 234 5678", "5552345678"],
    ["5552345678", "5552345678"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it("rejects numbers that are not 10 digits", () => {
    expect(normalizePhone("234-5678")).toBeNull();
  });
});

describe("parseVoterCsv", () => {
  it("parses a valid row", () => {
    const result = parseVoterCsv(csv("V1,Ana,Lopez,22 Birch St,Riverbend,48990,P-01,34,dem,(555) 300-0001,72"));

    expect(result.errors).toEqual([]);
    expect(result.voters).toEqual([
      {
        voterFileId: "V1",
        firstName: "Ana",
        lastName: "Lopez",
        address: "22 Birch St",
        houseNumber: 22,
        street: "Birch St",
        city: "Riverbend",
        zip: "48990",
        precinct: "P-01",
        age: 34,
        party: "DEM",
        phone: "5553000001",
        supportScore: 72,
      },
    ]);
  });

  it("accepts headers in any order and case, and a blank phone", () => {
    const text = [
      "PARTY,Voter_ID,first_name,last_name,address,city,zip,precinct,age,phone,support_score",
      "REP,V2,Ben,Okafor,10 Birch St,Riverbend,48990,P-01,51,,48",
    ].join("\r\n");

    const result = parseVoterCsv(text);

    expect(result.errors).toEqual([]);
    expect(result.voters[0]).toMatchObject({ voterFileId: "V2", party: "REP", phone: null });
  });

  it("handles quoted fields with commas", () => {
    const result = parseVoterCsv(csv('V3,"Mary Ann",Smith,"5 Oak St, Apt 2",Riverbend,48990,P-01,40,NPA,,50'));

    expect(result.voters[0]).toMatchObject({ firstName: "Mary Ann", address: "5 Oak St, Apt 2" });
  });

  it("reports bad rows by line number and keeps the good ones", () => {
    const result = parseVoterCsv(
      csv(
        "V1,Ana,Lopez,22 Birch St,Riverbend,48990,P-01,34,DEM,,72",
        "V2,Ben,Okafor,10 Birch St,Riverbend,48990,P-01,17,DEM,,72",
        "V3,Cara,Nguyen,5 Aspen Ct,Riverbend,4899,P-01,40,GREEN,123,101",
      ),
    );

    expect(result.voters.map((voter) => voter.voterFileId)).toEqual(["V1"]);
    expect(result.errors).toEqual([
      { line: 3, message: "age must be at least 18" },
      {
        line: 4,
        message:
          "zip must be 5 digits; party must be one of DEM, REP, NPA, OTH; phone must have 10 digits; support_score must be at most 100",
      },
    ]);
  });

  it("says which column is blank on a short row", () => {
    const result = parseVoterCsv(csv("V1,Ana,Lopez,22 Birch St,Riverbend,48990,P-01"));

    expect(result.errors[0].message).toContain("age must be a whole number");
  });

  it("rejects a repeated voter_id", () => {
    const row = "V1,Ana,Lopez,22 Birch St,Riverbend,48990,P-01,34,DEM,,72";

    const result = parseVoterCsv(csv(row, row));

    expect(result.voters).toHaveLength(1);
    expect(result.errors).toEqual([{ line: 3, message: "duplicate voter_id V1 (first seen on line 2)" }]);
  });

  it("rejects a file that is missing columns", () => {
    const result = parseVoterCsv("voter_id,first_name\nV1,Ana");

    expect(result.voters).toEqual([]);
    expect(result.errors).toEqual([
      {
        line: 1,
        message: "missing columns: last_name, address, city, zip, precinct, age, party, phone, support_score",
      },
    ]);
  });

  it("ignores blank lines without shifting line numbers", () => {
    const result = parseVoterCsv(
      csv(
        "V1,Ana,Lopez,22 Birch St,Riverbend,48990,P-01,34,DEM,,72",
        "",
        "V2,Ben,Okafor,10 Birch St,Riverbend,48990,P-01,17,DEM,,72",
        "",
      ),
    );

    expect(result.voters).toHaveLength(1);
    expect(result.errors).toEqual([{ line: 4, message: "age must be at least 18" }]);
  });
});
