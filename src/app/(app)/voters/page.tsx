import { AddressBook, CaretDown, CaretUp, CaretUpDown, DownloadSimple, UploadSimple } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/skeletons";
import { buttonClass, EmptyState, Num, PageHeader, secondaryButtonClass, Table, Tag } from "@/components/ui";
import { PendingRegion, UrlFilters } from "@/components/url-filters";
import { PARTY_LABELS } from "@/lib/constants";
import { OUTCOME_TONES, SHORT_OUTCOME_LABELS } from "@/lib/display";
import { formatDateTime, formatNumber, formatPhone } from "@/lib/format";
import { toSearchParams } from "@/lib/segments";
import { parseVoterFilters, voterFiltersHref, type VoterFilters, type VoterSort } from "@/lib/voter-filters";
import { countVoters, listPrecincts, searchVoters } from "@/lib/voters";
import { PageSizeSelect, ShowAllVotersButton, VoterSearch, VoterToolbar } from "./voter-toolbar";

export const metadata: Metadata = { title: "Voters" };

export default function VotersPage({ searchParams }: PageProps<"/voters">) {
  return (
    <>
      <PageHeader
        title="Voters"
        actions={
          <>
            <a href="/sample-voters.csv" download className={secondaryButtonClass}>
              <DownloadSimple size={16} aria-hidden />
              Sample CSV
            </a>
            <Link href="/voters/import" className={buttonClass}>
              <UploadSimple size={16} aria-hidden />
              Import CSV
            </Link>
          </>
        }
      />
      <Suspense fallback={<VotersSkeleton />}>
        <VoterTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

/** Shaped like the page: the count, the search bar, then the table. */
function VotersSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div aria-hidden className="h-15 w-72 max-w-full animate-skeleton rounded-md bg-soft" />
      <div className="flex flex-col gap-4">
        <div aria-hidden className="flex flex-wrap gap-2">
          <div className="h-9 min-w-0 flex-1 basis-64 animate-skeleton rounded-md bg-soft" />
          <div className="h-9 w-36 animate-skeleton rounded-md bg-soft" />
          <div className="h-9 w-32 animate-skeleton rounded-md bg-soft" />
        </div>
        <TableSkeleton rows={10} label="Loading voters" />
      </div>
    </div>
  );
}

async function VoterTable({ searchParams }: Pick<PageProps<"/voters">, "searchParams">) {
  await connection();
  const filters = parseVoterFilters(toSearchParams(await searchParams));
  const filtered = Boolean(filters.q || filters.precinct || filters.party);
  const [precincts, { total, rows }, inFile] = await Promise.all([listPrecincts(), searchVoters(filters), filtered ? countVoters() : null]);

  if (precincts.length === 0) {
    return (
      <EmptyState
        icon={<AddressBook size={24} aria-hidden />}
        title="No voters yet"
        action={{ href: "/voters/import", label: "Import a voter file" }}
      >
        Upload a CSV of voters. The sample file has 2,400 generated voters and three bad rows that show how errors are reported.
      </EmptyState>
    );
  }

  const lastPage = Math.max(1, Math.ceil(total / filters.pageSize));
  const first = total === 0 ? 0 : (filters.page - 1) * filters.pageSize + 1;
  const last = Math.min(filters.page * filters.pageSize, total);

  return (
    <UrlFilters>
      <VoterSearch filters={filters}>
        {/* flex, not grid: a grid track would grow to the table's full width and scroll the page. */}
        <div className="flex min-w-0 flex-col gap-8">
          {/* The one big number on the page: how many voters this view covers. */}
          <PendingRegion>
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="figure text-5xl text-indigo sm:text-6xl">{formatNumber(total)}</span>
              <span className="body-3 text-ink-2">
                {inFile === null
                  ? total === 1
                    ? "voter in the file"
                    : "voters in the file"
                  : `of ${formatNumber(inFile)} voters ${total === 1 ? "matches" : "match"}`}
              </span>
            </p>
          </PendingRegion>

          <div className="flex min-w-0 flex-col gap-4">
            <VoterToolbar precincts={precincts} />
            <PendingRegion>
              <div className="overflow-hidden rounded-2xl border border-line bg-paper">
                <Table label="Voters">
                  <thead className="border-b-2 border-ink">
                    <tr>
                      <SortHeader filters={filters} sort="name" label="Voter" sticky />
                      <th>Address</th>
                      <SortHeader filters={filters} sort="precinct" label="Precinct" />
                      <SortHeader filters={filters} sort="age" label="Age" align="right" />
                      <SortHeader filters={filters} sort="party" label="Party" />
                      <th>Phone</th>
                      <SortHeader filters={filters} sort="score" label="Support score" align="right" />
                      <th>Last contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((voter) => (
                      <tr key={voter.id}>
                        {/* The name stays in view while a phone scrolls the table sideways. */}
                        <td className="sticky left-0 z-10 bg-paper transition-colors duration-150 ease-out max-md:border-r [tr:hover>&]:bg-stock">
                          <span className="flex flex-wrap items-baseline gap-x-2">
                            <span className="body-4 whitespace-nowrap text-ink">
                              {voter.first_name} {voter.last_name}
                            </span>
                            <span className="caption-5 text-muted tabular-nums">{voter.voter_file_id}</span>
                          </span>
                        </td>
                        {/* Addresses and precinct names have no length limit, so they wrap instead of widening the table. */}
                        <td className="min-w-48 text-ink-2">{voter.address}</td>
                        <td className="min-w-24">{voter.precinct}</td>
                        <Num>{voter.age}</Num>
                        <td className="text-ink-2">
                          <span title={PARTY_LABELS[voter.party]}>{voter.party}</span>
                        </td>
                        <td className="whitespace-nowrap tabular-nums text-ink-2">
                          {voter.phone ? formatPhone(voter.phone) : <span className="caption-2 text-muted">No phone</span>}
                        </td>
                        <td>
                          <span className="flex items-center justify-end gap-2">
                            {/* A printed bar: indigo ink on the pale track, square ends. */}
                            <span aria-hidden className="h-1.5 w-12 bg-soft">
                              <span className="block h-full bg-indigo" style={{ width: `${voter.support_score}%` }} />
                            </span>
                            <span className="w-8 text-right tabular-nums">{voter.support_score}</span>
                          </span>
                        </td>
                        <td className="whitespace-nowrap">
                          {voter.last_outcome ? (
                            <span className="flex items-center gap-2">
                              <Tag tone={OUTCOME_TONES[voter.last_outcome]}>{SHORT_OUTCOME_LABELS[voter.last_outcome]}</Tag>
                              {voter.last_contact_at && (
                                <span className="caption-5 text-muted tabular-nums">{formatDateTime(voter.last_contact_at)}</span>
                              )}
                            </span>
                          ) : (
                            <span className="caption-2 text-muted">Not contacted</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12">
                          <div className="max-w-xs">
                            <p className="title-3">No voters match</p>
                            <p className="mt-1 body-6 text-ink-2">
                              Try a shorter search, or <ShowAllVotersButton />.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </PendingRegion>

            <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className="caption-2 text-muted tabular-nums">
                {total === 0 ? "No rows to show" : `Rows ${formatNumber(first)} to ${formatNumber(last)} of ${formatNumber(total)}`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <PageSizeSelect />
                <PageLink filters={filters} page={filters.page - 1} disabled={filters.page <= 1}>
                  Previous
                </PageLink>
                <span className="caption-2 whitespace-nowrap text-muted tabular-nums">
                  Page {formatNumber(filters.page)} of {formatNumber(lastPage)}
                </span>
                <PageLink filters={filters} page={filters.page + 1} disabled={filters.page >= lastPage}>
                  Next
                </PageLink>
              </div>
            </nav>
          </div>
        </div>
      </VoterSearch>
    </UrlFilters>
  );
}

function SortHeader({
  filters,
  sort,
  label,
  align = "left",
  sticky = false,
}: {
  filters: VoterFilters;
  sort: VoterSort;
  label: string;
  align?: "left" | "right";
  sticky?: boolean;
}) {
  const active = filters.sort === sort;
  const nextDir = active && filters.dir === "asc" ? "desc" : "asc";
  const Icon = !active ? CaretUpDown : filters.dir === "asc" ? CaretUp : CaretDown;
  return (
    <th
      aria-sort={active ? (filters.dir === "asc" ? "ascending" : "descending") : "none"}
      className={`${align === "right" ? "text-right" : ""} ${sticky ? "sticky left-0 z-10 bg-paper max-md:border-r max-md:border-line-soft" : ""}`}
    >
      <Link
        href={voterFiltersHref(filters, { sort, dir: nextDir })}
        scroll={false}
        className={`group -mx-1 inline-flex items-center gap-1 rounded-sm px-1 transition-colors duration-150 ease-out hover:text-ink ${
          active ? "text-indigo-deep" : ""
        }`}
      >
        {label}
        <Icon
          size={12}
          weight={active ? "bold" : "regular"}
          aria-hidden
          className={active ? "text-indigo" : "text-faint transition-colors duration-150 ease-out group-hover:text-muted"}
        />
      </Link>
    </th>
  );
}

function PageLink({ filters, page, disabled, children }: { filters: VoterFilters; page: number; disabled: boolean; children: string }) {
  if (disabled) {
    return (
      <span aria-disabled className={`${secondaryButtonClass} pointer-events-none opacity-40`}>
        {children}
      </span>
    );
  }
  return (
    <Link href={voterFiltersHref(filters, { page })} scroll={false} className={secondaryButtonClass}>
      {children}
    </Link>
  );
}
