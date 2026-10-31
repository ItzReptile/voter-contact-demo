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

const optionalInt = (min: number, max: number) => {
  const message = `Use a whole number from ${min} to ${max}.`;
  return z.preprocess(blankToUndefined, z.coerce.number(message).int(message).min(min, message).max(max, message).optional());
};

// A range the wrong way round names both numbers and the fix. The path files it under that range.
const swapped = (min: number | undefined, max: number | undefined) =>
  min !== undefined && max !== undefined && min > max ? `Minimum ${min} is above maximum ${max}. Swap them.` : null;

export const segmentSchema = z
  .object({
    precincts: z.array(z.string().min(1)).default([]),
    // A hand edited URL can say anything; say what is allowed instead of zod's default message.
    parties: z.array(z.enum(PARTIES, { error: `Party must be one of ${PARTIES.join(", ")}.` })).default([]),
    minAge: optionalInt(18, 120),
    maxAge: optionalInt(18, 120),
    minScore: optionalInt(0, 100),
    maxScore: optionalInt(0, 100),
    contact: z.enum(CONTACT_FILTERS, { error: "Pick a contact history from the list." }).default("any"),
  })
  .superRefine((s, ctx) => {
    const age = swapped(s.minAge, s.maxAge);
    if (age) ctx.addIssue({ code: "custom", path: ["minAge"], message: age });
    const score = swapped(s.minScore, s.maxScore);
    if (score) ctx.addIssue({ code: "custom", path: ["minScore"], message: score });
  });

export type Segment = z.infer<typeof segmentSchema>;

/** What is wrong with a segment, keyed by where the builder shows it: under a range's inputs, or for the filters as a whole. */
export type SegmentErrors = { age?: string; score?: string; other?: string };

const RANGE_OF: Partial<Record<PropertyKey, "age" | "score">> = {
  minAge: "age",
  maxAge: "age",
  minScore: "score",
  maxScore: "score",
};

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
): { ok: true; segment: Segment } | { ok: false; errors: SegmentErrors } {
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
    const errors: SegmentErrors = {};
    // The first problem in each place is enough to act on; fixing it shows the next.
    for (const issue of result.error.issues) errors[RANGE_OF[issue.path[0]] ?? "other"] ??= issue.message;
    return { ok: false, errors };
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
  if (min !== undefined && max !== undefined) return `${label} ${min} to ${max}`;
  if (min !== undefined) return `${label} ${min}+`;
  if (max !== undefined) return `${label} up to ${max}`;
  return null;
}

/** "P-03, P-04 and P-05" */
function joinWords(items: string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** A plain sentence fragment, e.g. "P-03 and P-04, score 40 to 60, not yet reached". No hyphens in UI copy. */
export function describeSegment(segment: Segment): string {
  const parts = [
    segment.precincts.length > 0 ? joinWords(segment.precincts) : "All precincts",
    segment.parties.length > 0 ? joinWords(segment.parties.map((party) => PARTY_LABELS[party])) : null,
    range("age", segment.minAge, segment.maxAge),
    range("score", segment.minScore, segment.maxScore),
    segment.contact === "any" ? null : CONTACT_FILTER_LABELS[segment.contact].toLowerCase(),
  ];
  return parts.filter((part) => part !== null).join(", ");
}

/** Default name offered when creating a list. */
export function suggestListName(segment: Segment, kind: ListKind): string {
  return `${kind === "door" ? "Doors" : "Calls"}: ${describeSegment(segment)}`;
}
