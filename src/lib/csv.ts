import Papa from "papaparse";
import { z } from "zod";
import { PARTIES, REQUIRED_COLUMNS, type Party } from "./constants";

export type VoterInput = {
  voterFileId: string;
  firstName: string;
  lastName: string;
  address: string;
  houseNumber: number | null;
  street: string;
  city: string;
  zip: string;
  precinct: string;
  age: number;
  party: Party;
  phone: string | null;
  supportScore: number;
};

export type RowError = { line: number; message: string };

export type ParseResult = { voters: VoterInput[]; errors: RowError[] };

/** "412 Maple Ave" → { houseNumber: 412, street: "Maple Ave" }. No leading number → houseNumber null. */
export function splitAddress(address: string): { houseNumber: number | null; street: string } {
  const match = address.trim().match(/^(\d+)[A-Za-z]?\s+(.+)$/);
  if (!match) return { houseNumber: null, street: address.trim() };
  return { houseNumber: Number(match[1]), street: match[2].trim() };
}

/** Any US phone format → 10 digits, or null if it isn't 10 digits (after dropping a leading 1). */
export function normalizePhone(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits.length === 10 ? digits : null;
}

const requiredText = (column: string) =>
  z.string().trim().min(1, `${column} is required`);

const wholeNumber = (column: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${column} must be a whole number`)
    .transform(Number)
    .pipe(
      z
        .number()
        .min(min, `${column} must be at least ${min}`)
        .max(max, `${column} must be at most ${max}`),
    );

const rowSchema = z.object({
  voter_id: requiredText("voter_id"),
  first_name: requiredText("first_name"),
  last_name: requiredText("last_name"),
  address: requiredText("address"),
  city: requiredText("city"),
  zip: z.string().trim().regex(/^\d{5}$/, "zip must be 5 digits"),
  precinct: requiredText("precinct"),
  age: wholeNumber("age", 18, 120),
  party: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.enum(PARTIES, { error: `party must be one of ${PARTIES.join(", ")}` })),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || normalizePhone(value) !== null, "phone must have 10 digits")
    .transform((value) => (value === "" ? null : normalizePhone(value))),
  support_score: wholeNumber("support_score", 0, 100),
});

/**
 * Parses and validates a voter file. Good rows come back as voters; bad rows come back as
 * errors with their line number in the file (line 1 is the header). One bad row never
 * blocks the rest of the file.
 */
export function parseVoterCsv(text: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    // Blank lines are skipped in the loop below instead, so line numbers stay exact.
    skipEmptyLines: false,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  const columns = parsed.meta.fields ?? [];
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));
  if (missing.length > 0) {
    return { voters: [], errors: [{ line: 1, message: `missing columns: ${missing.join(", ")}` }] };
  }

  const voters: VoterInput[] = [];
  const errors: RowError[] = [];
  const firstLineById = new Map<string, number>();

  parsed.data.forEach((raw, index) => {
    const line = index + 2;
    if (Object.values(raw).every((value) => (value ?? "").trim() === "")) return;

    // A short row leaves trailing columns undefined; treat them as blank so the
    // error says "age is required" rather than a type error.
    const values = Object.fromEntries(REQUIRED_COLUMNS.map((column) => [column, raw[column] ?? ""]));
    const result = rowSchema.safeParse(values);
    if (!result.success) {
      errors.push({ line, message: result.error.issues.map((issue) => issue.message).join("; ") });
      return;
    }

    const row = result.data;
    const firstLine = firstLineById.get(row.voter_id);
    if (firstLine !== undefined) {
      errors.push({ line, message: `duplicate voter_id ${row.voter_id} (first seen on line ${firstLine})` });
      return;
    }
    firstLineById.set(row.voter_id, line);

    voters.push({
      voterFileId: row.voter_id,
      firstName: row.first_name,
      lastName: row.last_name,
      address: row.address,
      ...splitAddress(row.address),
      city: row.city,
      zip: row.zip,
      precinct: row.precinct,
      age: row.age,
      party: row.party,
      phone: row.phone,
      supportScore: row.support_score,
    });
  });

  return { voters, errors };
}
