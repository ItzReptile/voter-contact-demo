// Generates the sample voter file. Every name, address and phone number is made up.
// Phones use area code 555, which isn't in service. Never imported by the app.
import { faker } from "@faker-js/faker";
import Papa from "papaparse";
import { REQUIRED_COLUMNS } from "@/lib/constants";

type Row = Record<(typeof REQUIRED_COLUMNS)[number], string>;

export const PRECINCTS = Array.from({ length: 12 }, (_, i) => `P-${String(i + 1).padStart(2, "0")}`);

const STREET_NAMES = [
  "Oak", "Maple", "Cedar", "Elm", "Pine", "Birch", "Willow", "Walnut", "Cherry", "Aspen", "Spruce", "Hickory",
  "Lake", "River", "Hill", "Mill", "Park", "Church", "Spring", "Meadow", "Orchard", "Sunset", "Highland", "Ridge",
  "Washington", "Lincoln", "Jefferson", "Franklin", "Jackson", "Adams", "Madison", "Monroe", "Grant", "Clark",
];
const STREET_SUFFIXES = ["St", "Ave", "Rd", "Dr", "Ct", "Ln"];
const TOWNS = [
  { city: "Riverbend", zip: "48990" },
  { city: "Oak Hollow", zip: "48991" },
];

/** Three rows that fail validation, so uploading the sample shows the import report. */
const BAD_ROWS: { index: number; change: Partial<Row> }[] = [
  { index: 40, change: { age: "17" } },
  { index: 400, change: { zip: "4899" } },
  { index: 1200, change: { party: "Green" } },
];

function weighted<T>(options: [T, number][]): T {
  let roll = faker.number.float({ min: 0, max: 1 });
  for (const [value, weight] of options) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return options[options.length - 1][0];
}

/** Roughly bell-shaped around center: the average of two uniform draws. */
function around(center: number, spread: number): number {
  const a = faker.number.float({ min: -spread, max: spread });
  const b = faker.number.float({ min: -spread, max: spread });
  return Math.round(Math.min(100, Math.max(0, center + (a + b) / 2)));
}

function fakePhone(): string {
  const exchange = faker.number.int({ min: 200, max: 999 });
  const line = faker.string.numeric(4);
  // Mixed formats on purpose: the importer normalizes them.
  return weighted([
    [`(555) ${exchange}-${line}`, 0.5],
    [`555-${exchange}-${line}`, 0.3],
    [`555${exchange}${line}`, 0.2],
  ]);
}

export function generateVoterRows(count = 2400, seed = 2026): Row[] {
  faker.seed(seed);

  // Each precinct gets its own streets and a partisan lean, so segments by precinct differ.
  const streets = faker.helpers.shuffle(
    STREET_NAMES.flatMap((name) => STREET_SUFFIXES.map((suffix) => `${name} ${suffix}`)),
  );
  const precincts = PRECINCTS.map((name, i) => ({
    name,
    town: TOWNS[i < 7 ? 0 : 1],
    streets: streets.slice(i * 6, i * 6 + 6),
    lean: faker.number.float({ min: -0.2, max: 0.2 }),
  }));
  const usedAddresses = new Set<string>();

  const rows: Row[] = [];
  for (let i = 0; i < count; i++) {
    const precinct = faker.helpers.arrayElement(precincts);
    let address: string;
    do {
      address = `${faker.number.int({ min: 100, max: 2999 })} ${faker.helpers.arrayElement(precinct.streets)}`;
    } while (usedAddresses.has(address));
    usedAddresses.add(address);

    const party = weighted<string>([
      ["DEM", 0.36 + precinct.lean],
      ["REP", 0.34 - precinct.lean],
      ["NPA", 0.26],
      ["OTH", 0.04],
    ]);
    // Scores overlap across parties, so a 40-60 "persuadable" range catches some of each.
    const supportScore = { DEM: around(74, 40), REP: around(24, 40), NPA: around(50, 45), OTH: around(42, 45) }[party]!;
    const age = weighted<[number, number]>([
      [[18, 29], 0.19],
      [[30, 44], 0.25],
      [[45, 64], 0.33],
      [[65, 94], 0.23],
    ]);

    rows.push({
      voter_id: `RV${String(i + 1).padStart(6, "0")}`,
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      address,
      city: precinct.town.city,
      zip: precinct.town.zip,
      precinct: precinct.name,
      age: String(faker.number.int({ min: age[0], max: age[1] })),
      party,
      phone: faker.datatype.boolean({ probability: 0.72 }) ? fakePhone() : "",
      support_score: String(supportScore),
    });
  }

  for (const { index, change } of BAD_ROWS) {
    if (index < rows.length) Object.assign(rows[index], change);
  }
  return rows;
}

export function generateVoterCsv(count?: number, seed?: number): string {
  return Papa.unparse({ fields: [...REQUIRED_COLUMNS], data: generateVoterRows(count, seed) }, { newline: "\n" });
}
