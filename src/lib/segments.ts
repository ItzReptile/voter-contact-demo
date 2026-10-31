import { z } from "zod";
import {
  CONTACT_FILTER_LABELS,
  CONTACT_FILTERS,
  LIST_KINDS,
  PARTIES,
  PARTY_LABELS,
  type ListKind,
} from "./constants";

// Form fields and URL params arrive as strings; a blank one means "no filter".
const blankToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

const optionalInt = (min: number, max: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().int().min(min).max(max).optional());

export const segmentSchema = z
  .object({
    precincts: z.array(z.string().min(1)).default([]),
    parties: z.array(z.enum(PARTIES)).default([]),
    minAge: optionalInt(18, 120),
    maxAge: optionalInt(18, 120),
    minScore: optionalInt(0, 100),
    maxScore: optionalInt(0, 100),
    contact: z.enum(CONTACT_FILTERS).default("any"),
  })
  .refine((s) => s.minAge === undefined || s.maxAge === undefined || s.minAge <= s.maxAge, {
    message: "Minimum age is above maximum age",
  })
  .refine((s) => s.minScore === undefined || s.maxScore === undefined || s.minScore <= s.maxScore, {
    message: "Minimum score is above maximum score",
  });

export type Segment = z.infer<typeof segmentSchema>;

export const listKindSchema = z.enum(LIST_KINDS);

/** Next passes searchParams as an object; this turns it back into URLSearchParams. */
export function toSearchParams(record: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      params.append(key, item);
    }
  }
  return params;
}

/** Reads a segment from URL search params or form data (precinct and party can repeat). */
export function parseSegmentParams(
  params: URLSearchParams,
): { ok: true; segment: Segment } | { ok: false; error: string } {
  const result = segmentSchema.safeParse({
    precincts: params.getAll("precinct"),
    parties: params.getAll("party"),
    minAge: params.get("minAge"),
    maxAge: params.get("maxAge"),
    minScore: params.get("minScore"),
    maxScore: params.get("maxScore"),
    contact: params.get("contact") || undefined,
  });
  if (!result.success) {
    return { ok: false, error: result.error.issues.map((issue) => issue.message).join("; ") };
  }
  return { ok: true, segment: result.data };
}

/**
 * Turns a segment into a SQL condition on `voters v`, with $1, $2... placeholders and the
 * matching parameter values. Values never go into the SQL text.
 */
export function buildSegmentWhere(segment: Segment, kind: ListKind): { where: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  const param = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (segment.precincts.length > 0) conditions.push(`v.precinct = any(${param(segment.precincts)})`);
  if (segment.parties.length > 0) conditions.push(`v.party = any(${param(segment.parties)})`);
  if (segment.minAge !== undefined) conditions.push(`v.age >= ${param(segment.minAge)}`);
  if (segment.maxAge !== undefined) conditions.push(`v.age <= ${param(segment.maxAge)}`);
  if (segment.minScore !== undefined) conditions.push(`v.support_score >= ${param(segment.minScore)}`);
  if (segment.maxScore !== undefined) conditions.push(`v.support_score <= ${param(segment.maxScore)}`);

  if (segment.contact === "never_attempted") {
    conditions.push("not exists (select 1 from contacts c where c.voter_id = v.id)");
  } else if (segment.contact === "not_reached") {
    conditions.push("not exists (select 1 from contacts c where c.voter_id = v.id and c.outcome = 'reached')");
  }

  // You can't call someone without a number.
  if (kind === "phone") conditions.push("v.phone is not null");

  return { where: conditions.length > 0 ? conditions.join(" and ") : "true", params };
}

/** Door lists go in walk order (one street at a time); phone lists alphabetically. */
export function listOrderBy(kind: ListKind): string {
  return kind === "door"
    ? "v.precinct, v.street, v.house_number nulls last, v.id"
    : "v.last_name, v.first_name, v.id";
}

function range(label: string, min: number | undefined, max: number | undefined): string | null {
  if (min !== undefined && max !== undefined) return `${label} ${min}-${max}`;
  if (min !== undefined) return `${label} ${min}+`;
  if (max !== undefined) return `${label} up to ${max}`;
  return null;
}

/** A short human description, e.g. "P-03 · score 40-60 · not yet reached". */
export function describeSegment(segment: Segment): string {
  const parts = [
    segment.precincts.length > 0 ? segment.precincts.join(", ") : "All precincts",
    segment.parties.length > 0 ? segment.parties.map((party) => PARTY_LABELS[party]).join("/") : null,
    range("age", segment.minAge, segment.maxAge),
    range("score", segment.minScore, segment.maxScore),
    segment.contact === "any" ? null : CONTACT_FILTER_LABELS[segment.contact].toLowerCase(),
  ];
  return parts.filter((part) => part !== null).join(" · ");
}

/** Default name offered when creating a list. */
export function suggestListName(segment: Segment, kind: ListKind): string {
  return `${kind === "door" ? "Doors" : "Calls"} · ${describeSegment(segment)}`;
}
