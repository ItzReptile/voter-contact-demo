// Enums and display labels. No database imports here, so Client Components can use this file.
// The allowed values must match the check constraints in db/schema.sql.

/** Columns a voter file must have, in any order. Header names are case-insensitive. */
export const REQUIRED_COLUMNS = [
  "voter_id",
  "first_name",
  "last_name",
  "address",
  "city",
  "zip",
  "precinct",
  "age",
  "party",
  "phone",
  "support_score",
] as const;

export const PARTIES = ["DEM", "REP", "NPA", "OTH"] as const;
export type Party = (typeof PARTIES)[number];
export const PARTY_LABELS: Record<Party, string> = {
  DEM: "Democratic",
  REP: "Republican",
  NPA: "No party",
  OTH: "Other",
};

export const LIST_KINDS = ["door", "phone"] as const;
export type ListKind = (typeof LIST_KINDS)[number];
export const LIST_KIND_LABELS: Record<ListKind, string> = {
  door: "Door knocking",
  phone: "Phone calls",
};

// "moved" is for doors (the voter no longer lives there), "wrong_number" for calls.
export const OUTCOMES = ["reached", "not_home", "moved", "wrong_number"] as const;
export type Outcome = (typeof OUTCOMES)[number];
export const OUTCOME_LABELS: Record<Outcome, string> = {
  reached: "Reached",
  not_home: "Not home",
  moved: "Moved",
  wrong_number: "Wrong number",
};

// The 1-5 support ID recorded in a conversation. 1 is best for our side.
export const SUPPORT_LEVELS = [1, 2, 3, 4, 5] as const;
export const SUPPORT_LABELS: Record<number, string> = {
  1: "Strong support",
  2: "Lean support",
  3: "Undecided",
  4: "Lean oppose",
  5: "Strong oppose",
};

export const CONTACT_FILTERS = ["any", "never_attempted", "not_reached"] as const;
export type ContactFilter = (typeof CONTACT_FILTERS)[number];
export const CONTACT_FILTER_LABELS: Record<ContactFilter, string> = {
  any: "Anyone",
  never_attempted: "Never attempted",
  not_reached: "Not yet reached",
};
