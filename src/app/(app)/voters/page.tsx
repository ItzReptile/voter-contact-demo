import { AddressBook, CaretDown, CaretUp, CaretUpDown, DownloadSimple, UploadSimple } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/skeletons";
import { buttonClass, EmptyState, Num, PageHeader, secondaryButtonClass, Table, Tag } from "@/components/ui";
import { PendingRegion, UrlFilters } from "@/components/url-filters";
import { OUTCOME_TONES, SHORT_OUTCOME_LABELS } from "@/lib/display";
import { formatDateTime, formatNumber, formatPhone } from "@/lib/format";
import { toSearchParams } from "@/lib/segments";
import { parseVoterFilters, voterFiltersHref, type VoterFilters, type VoterSort } from "@/lib/voter-filters";
import { listPrecincts, searchVoters } from "@/lib/voters";
import { VoterToolbar } from "./voter-toolbar";

export const metadata: Metadata = { title: "Voters" };

export default function VotersPage({ searchParams }: PageProps<"/voters">) {
  return (
    <>
      <PageHeader
        title="Voters"
        description="Everyone in the voter file. Search, filter and sort; click a column to sort by it."
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
      <Suspense fallback={<TableSkeleton rows={10} label="Loading voters" />}>
        <VoterTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function VoterTable({ searchParams }: Pick<PageProps<"/voters">, "searchParams">) {
  await connection();
  const filters = parseVoterFilters(toSearchParams(await searchParams));
  const [precincts, { total, rows }] = await Promise.all([listPrecincts(), searchVoters(filters)]);

  if (precincts.length === 0) {
    return (
      <EmptyState icon={<AddressBook size={24} aria-hidden />} title="No voters yet" action={{ href: "/voters/import", label: "Import a voter file" }}>
        Upload a CSV of voters. The sample file has 2,400 generated voters and three bad rows that show how errors are reported.
      </EmptyState>
    );
  }

  const lastPage = Math.max(1, Math.ceil(total / filters.pageSize));
  const first = total === 0 ? 0 : (filters.page - 1) * filters.pageSize + 1;
  const last = Math.min(filters.page * filters.pageSize, total);

  return (
    <UrlFilters>
      {/* flex, not grid: a grid track would grow to the table's full width and scroll the page. */}
      <div className="flex min-w-0 flex-col gap-4">
        <VoterToolbar filters={filters} precincts={precincts} />
        <PendingRegion>
          <div className="overflow-hidden rounded-xl border border-line">
            <Table label="Voters">
              <thead>
                <tr>
                  <SortHeader filters={filters} sort="name" label="Voter" />
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
                    <td className="whitespace-nowrap">
                      <span className="block body-5">
                        {voter.first_name} {voter.last_name}
                      </span>
                      <span className="caption-5 text-muted">{voter.voter_file_id}</span>
                    </td>
                    <td className="whitespace-nowrap">{voter.address}</td>
                    <td>{voter.precinct}</td>
                    <Num>{voter.age}</Num>
                    <td>
                      <Tag dot={false}>{voter.party}</Tag>
                    </td>
                    <td className="whitespace-nowrap tabular-nums text-ink-2">{formatPhone(voter.phone)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <span className="h-1.5 w-12 overflow-hidden rounded-full bg-hover" aria-hidden>
                          <span className="block h-full rounded-full bg-accent" style={{ width: `${voter.support_score}%` }} />
                        </span>
                        <span className="w-8 text-right tabular-nums">{voter.support_score}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
                      {voter.last_outcome ? (
                        <span className="flex items-center gap-2">
                          <Tag tone={OUTCOME_TONES[voter.last_outcome]}>{SHORT_OUTCOME_LABELS[voter.last_outcome]}</Tag>
                          {voter.last_contact_at && <span className="caption-5 text-muted">{formatDateTime(voter.last_contact_at)}</span>}
                        </span>
                      ) : (
                        <span className="caption-2 text-faint">Not contacted</span>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted">
                      No voters match. Try a shorter search or clear the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </PendingRegion>
        <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-4">
          <p className="caption-2 text-muted">
            {total === 0 ? "No results" : `Showing ${formatNumber(first)} to ${formatNumber(last)} of ${formatNumber(total)}`}
          </p>
          <div className="flex items-center gap-2">
            <PageLink filters={filters} page={filters.page - 1} disabled={filters.page <= 1}>
              Previous
            </PageLink>
            <span className="caption-2 text-muted tabular-nums">
              Page {filters.page} of {lastPage}
            </span>
            <PageLink filters={filters} page={filters.page + 1} disabled={filters.page >= lastPage}>
              Next
            </PageLink>
          </div>
        </nav>
      </div>
    </UrlFilters>
  );
}

function SortHeader({
  filters,
  sort,
  label,
  align = "left",
}: {
  filters: VoterFilters;
  sort: VoterSort;
  label: string;
  align?: "left" | "right";
}) {
  const active = filters.sort === sort;
  const nextDir = active && filters.dir === "asc" ? "desc" : "asc";
  const Icon = !active ? CaretUpDown : filters.dir === "asc" ? CaretUp : CaretDown;
  return (
    <th aria-sort={active ? (filters.dir === "asc" ? "ascending" : "descending") : "none"} className={align === "right" ? "text-right" : ""}>
      <Link
        href={voterFiltersHref(filters, { sort, dir: nextDir })}
        scroll={false}
        className={`inline-flex items-center gap-1 rounded transition hover:text-ink ${active ? "text-ink" : ""}`}
      >
        {label}
        <Icon size={12} aria-hidden />
      </Link>
    </th>
  );
}

function PageLink({
  filters,
  page,
  disabled,
  children,
}: {
  filters: VoterFilters;
  page: number;
  disabled: boolean;
  children: string;
}) {
  if (disabled) {
    return (
      <span aria-disabled className={`${secondaryButtonClass} cursor-not-allowed opacity-50`}>
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
