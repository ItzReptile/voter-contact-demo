"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { ghostButtonClass, inputClass } from "@/components/ui";
import { useFilterNavigation } from "@/components/url-filters";
import { PARTIES, PARTY_LABELS } from "@/lib/constants";
import { PAGE_SIZES, voterFiltersHref, type VoterFilters } from "@/lib/voter-filters";

export function VoterToolbar({ filters, precincts }: { filters: VoterFilters; precincts: string[] }) {
  const { navigate } = useFilterNavigation();
  const [q, setQ] = useState(filters.q);
  const first = useRef(true);

  // Search as you type, 300ms after the last keystroke.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => navigate(voterFiltersHref(filters, { q: q.trim() })), 300);
    return () => clearTimeout(timer);
    // Only the typed text should trigger this; the other filters navigate on their own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filtered = filters.q || filters.precinct || filters.party;

  return (
    <div role="search" className="flex flex-wrap items-center gap-2">
      <label className="relative min-w-0 flex-1 basis-56">
        <span className="sr-only">Search voters</span>
        <MagnifyingGlass size={16} aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
        <input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search name, address or voter ID"
          className={`${inputClass} w-full pl-8`}
        />
      </label>
      <select
        aria-label="Precinct"
        value={filters.precinct}
        onChange={(event) => navigate(voterFiltersHref(filters, { precinct: event.target.value }))}
        className={inputClass}
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
        onChange={(event) => navigate(voterFiltersHref(filters, { party: event.target.value as VoterFilters["party"] }))}
        className={inputClass}
      >
        <option value="">All parties</option>
        {PARTIES.map((party) => (
          <option key={party} value={party}>
            {PARTY_LABELS[party]}
          </option>
        ))}
      </select>
      <select
        aria-label="Rows per page"
        value={filters.pageSize}
        onChange={(event) => navigate(voterFiltersHref(filters, { pageSize: Number(event.target.value) }))}
        className={inputClass}
      >
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size} rows
          </option>
        ))}
      </select>
      {filtered && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            navigate(voterFiltersHref(filters, { q: "", precinct: "", party: "" }));
          }}
          className={ghostButtonClass}
        >
          <X size={14} aria-hidden />
          Clear
        </button>
      )}
    </div>
  );
}
