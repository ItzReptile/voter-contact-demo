"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ghostButtonClass, inputClass, linkClass } from "@/components/ui";
import { useFilterNavigation } from "@/components/url-filters";
import { PARTIES, PARTY_LABELS } from "@/lib/constants";
import { PAGE_SIZES, voterFiltersHref, type VoterFilters } from "@/lib/voter-filters";

type VoterSearchState = {
  filters: VoterFilters;
  /** What is typed in the search box, which runs ahead of the URL while someone types. */
  q: string;
  search: (value: string) => void;
  /** Changes a filter now, keeping whatever is typed. */
  change: (change: Partial<VoterFilters>) => void;
  clear: () => void;
};

const VoterSearchContext = createContext<VoterSearchState | null>(null);

function useVoterSearch(): VoterSearchState {
  const state = useContext(VoterSearchContext);
  if (!state) throw new Error("Voter search controls must sit inside <VoterSearch>.");
  return state;
}

/**
 * Holds the typed search for the toolbar, the page size select and the empty table, so any of
 * them can clear it. Sits inside <UrlFilters>, which does the navigating.
 */
export function VoterSearch({ filters, children }: { filters: VoterFilters; children: ReactNode }) {
  const { navigate } = useFilterNavigation();
  const [q, setQ] = useState(filters.q);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef(filters);

  useEffect(() => {
    latest.current = filters;
  }, [filters]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const change = (next: Partial<VoterFilters>) => {
    clearTimeout(timer.current);
    navigate(voterFiltersHref(filters, { q: q.trim(), ...next }));
  };

  const value: VoterSearchState = {
    filters,
    q,
    // Search as you type, 300ms after the last keystroke.
    search: (text) => {
      setQ(text);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => navigate(voterFiltersHref(latest.current, { q: text.trim() })), 300);
    },
    change,
    clear: () => {
      setQ("");
      change({ q: "", precinct: "", party: "" });
    },
  };

  return <VoterSearchContext.Provider value={value}>{children}</VoterSearchContext.Provider>;
}

export function VoterToolbar({ precincts }: { precincts: string[] }) {
  const { filters, q, search, change, clear } = useVoterSearch();
  const filtered = Boolean(q.trim() || filters.q || filters.precinct || filters.party);

  return (
    <div role="search" className="flex flex-wrap items-center gap-2">
      <label className="relative min-w-0 flex-1 basis-full sm:basis-64">
        <span className="sr-only">Search voters</span>
        <MagnifyingGlass size={16} aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(event) => search(event.target.value)}
          placeholder="Search name, address or voter ID"
          className={`${inputClass} w-full pl-8 max-sm:body-3`}
        />
      </label>
      <select
        aria-label="Precinct"
        value={filters.precinct}
        onChange={(event) => change({ precinct: event.target.value })}
        className={`${inputClass} min-w-0 flex-1 basis-36 sm:flex-none sm:basis-auto max-sm:body-3`}
      >
        <option value="">All precincts</option>
        {precincts.map((precinct) => (
          <option key={precinct} value={precinct}>
            {precinct}
          </option>
        ))}
      </select>
      <select
        aria-label="Party"
        value={filters.party}
        onChange={(event) => change({ party: event.target.value as VoterFilters["party"] })}
        className={`${inputClass} min-w-0 flex-1 basis-36 sm:flex-none sm:basis-auto max-sm:body-3`}
      >
        <option value="">All parties</option>
        {PARTIES.map((party) => (
          <option key={party} value={party}>
            {PARTY_LABELS[party]}
          </option>
        ))}
      </select>
      {filtered && (
        <button type="button" onClick={clear} className={ghostButtonClass}>
          <X size={14} aria-hidden />
          Clear
        </button>
      )}
    </div>
  );
}

export function PageSizeSelect() {
  const { filters, change } = useVoterSearch();
  return (
    <select
      aria-label="Rows per page"
      value={filters.pageSize}
      onChange={(event) => change({ pageSize: Number(event.target.value) })}
      className={`${inputClass} max-sm:body-3`}
    >
      {PAGE_SIZES.map((size) => (
        <option key={size} value={size}>
          {size} rows
        </option>
      ))}
    </select>
  );
}

/** The way out of an empty result: drops the search and every filter. */
export function ShowAllVotersButton() {
  const { clear } = useVoterSearch();
  return (
    <button type="button" onClick={clear} className={`${linkClass} rounded-sm`}>
      show all voters
    </button>
  );
}
