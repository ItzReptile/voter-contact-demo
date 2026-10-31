import { PARTIES, type Party } from "./constants";

// Filters, sorting and paging for the voter table. Pure: everything here is unit tested.
// Sort columns come from this fixed map, never from the URL, so ORDER BY can't be injected.

export const VOTER_SORTS = {
  name: ["v.last_name", "v.first_name"],
  precinct: ["v.precinct", "v.street", "v.house_number"],
  age: ["v.age"],
  party: ["v.party"],
  score: ["v.support_score"],
} as const;

export type VoterSort = keyof typeof VOTER_SORTS;
export type SortDirection = "asc" | "desc";

export const PAGE_SIZES = [25, 50, 100] as const;

export type VoterFilters = {
  q: string;
  precinct: string;
  party: Party | "";
  sort: VoterSort;
  dir: SortDirection;
  page: number;
  pageSize: number;
};

export const DEFAULT_VOTER_FILTERS: VoterFilters = {
  q: "",
  precinct: "",
  party: "",
  sort: "name",
  dir: "asc",
  page: 1,
  pageSize: 25,
};

/** Reads filters from the URL. Anything unknown falls back to the default instead of erroring. */
export function parseVoterFilters(params: URLSearchParams): VoterFilters {
  const sort = params.get("sort") ?? "";
  const party = (params.get("party") ?? "").toUpperCase();
  const pageSize = Number(params.get("size"));
  return {
    q: (params.get("q") ?? "").trim().slice(0, 80),
    precinct: (params.get("precinct") ?? "").trim(),
    party: (PARTIES as readonly string[]).includes(party) ? (party as Party) : "",
    sort: sort in VOTER_SORTS ? (sort as VoterSort) : DEFAULT_VOTER_FILTERS.sort,
    dir: params.get("dir") === "desc" ? "desc" : "asc",
    page: Math.max(1, Math.floor(Number(params.get("page"))) || 1),
    pageSize: (PAGE_SIZES as readonly number[]).includes(pageSize) ? pageSize : DEFAULT_VOTER_FILTERS.pageSize,
  };
}

/** Escapes % and _ so a search for "50%" matches the text, not everything. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** WHERE clause on `voters v` with $n placeholders, plus the parameter values. */
export function buildVoterWhere(filters: VoterFilters): { where: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  const param = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (filters.q) {
    const pattern = param(`%${escapeLike(filters.q)}%`);
    conditions.push(
      `(v.first_name || ' ' || v.last_name ilike ${pattern} or v.address ilike ${pattern} or v.voter_file_id ilike ${pattern})`,
    );
  }
  if (filters.precinct) conditions.push(`v.precinct = ${param(filters.precinct)}`);
  if (filters.party) conditions.push(`v.party = ${param(filters.party)}`);

  return { where: conditions.length > 0 ? conditions.join(" and ") : "true", params };
}

export function voterOrderBy(filters: VoterFilters): string {
  return [...VOTER_SORTS[filters.sort].map((column) => `${column} ${filters.dir}`), "v.id"].join(", ");
}

/** The URL for the same view with some filters changed. Changing a filter goes back to page 1. */
export function voterFiltersHref(filters: VoterFilters, change: Partial<VoterFilters>): string {
  const next = { ...filters, ...change };
  if (!("page" in change)) next.page = 1;
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.precinct) params.set("precinct", next.precinct);
  if (next.party) params.set("party", next.party);
  if (next.sort !== DEFAULT_VOTER_FILTERS.sort || next.dir !== DEFAULT_VOTER_FILTERS.dir) {
    params.set("sort", next.sort);
    params.set("dir", next.dir);
  }
  if (next.pageSize !== DEFAULT_VOTER_FILTERS.pageSize) params.set("size", String(next.pageSize));
  if (next.page > 1) params.set("page", String(next.page));
  const query = params.toString();
  return query ? `/voters?${query}` : "/voters";
}
