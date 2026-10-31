import { ChartBar } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { DashboardSkeleton } from "@/components/skeletons";
import { StackedBar } from "@/components/stacked-bar";
import { Card, EmptyState, linkClass, Meter, Num, PageHeader, Table } from "@/components/ui";
import { LIST_KIND_LABELS, OUTCOME_LABELS, OUTCOMES, SUPPORT_LABELS, SUPPORT_LEVELS } from "@/lib/constants";
import { getOutcomeCounts, getPrecinctStats, getSupportCounts, getTotals } from "@/lib/dashboard";
import { formatNumber, formatPercent, rate } from "@/lib/format";
import { getListSummaries } from "@/lib/lists";

export const metadata: Metadata = { title: "Dashboard" };

const OUTCOME_COLORS = {
  reached: "var(--outcome-reached)",
  not_home: "var(--outcome-not-home)",
  wrong_number: "var(--outcome-wrong-number)",
} as const;

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Contact rate is conversations divided by attempts. Supporters are voters who gave a 1 or 2."
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  await connection();
  const [totals, outcomes, supports, precincts, lists] = await Promise.all([
    getTotals(),
    getOutcomeCounts(),
    getSupportCounts(),
    getPrecinctStats(),
    getListSummaries(),
  ]);

  if (totals.voters === 0) {
    return (
      <EmptyState
        icon={<ChartBar size={24} aria-hidden />}
        title="No voters yet"
        action={{ href: "/voters", label: "Import a voter file" }}
      >
        Import a CSV to fill the dashboard, or run npm run seed to load the demo data.
      </EmptyState>
    );
  }

  return (
    <>
      <section aria-label="Totals" className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="caption-1 text-ink-2">Contact rate</p>
          <p className="mt-2 heading-2">{formatPercent(rate(totals.conversations, totals.attempts))}</p>
        </div>
        <Tile label="Attempts" value={formatNumber(totals.attempts)} />
        <Tile label="Conversations" value={formatNumber(totals.conversations)} />
        <Tile label="Supporters ID'd" value={formatNumber(totals.supporters)} />
        <Tile
          label="Voters on a list"
          value={formatNumber(totals.voters_on_lists)}
          note={`of ${formatNumber(totals.voters)} in the file`}
        />
      </section>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card title="Outcomes of all attempts">
          <StackedBar
            label="Outcomes"
            segments={OUTCOMES.map((outcome) => ({
              key: outcome,
              label: OUTCOME_LABELS[outcome],
              value: outcomes[outcome],
              color: OUTCOME_COLORS[outcome],
            }))}
          />
        </Card>
        <Card title="Support IDs from conversations">
          <StackedBar
            label="Support IDs"
            segments={SUPPORT_LEVELS.map((level) => ({
              key: String(level),
              label: `${level} · ${SUPPORT_LABELS[level]}`,
              value: supports[level],
              color: `var(--support-${level})`,
            }))}
          />
        </Card>
      </div>

      <Card title="By precinct" className="mb-6">
        <Table label="By precinct">
          <thead>
            <tr>
              <th>Precinct</th>
              <th className="text-right">Voters</th>
              <th>Voters attempted</th>
              <th className="text-right">Attempts</th>
              <th className="text-right">Conversations</th>
              <th className="text-right">Contact rate</th>
              <th className="text-right">Supporters</th>
            </tr>
          </thead>
          <tbody>
            {precincts.map((row) => (
              <tr key={row.precinct}>
                <td>{row.precinct}</td>
                <Num>{formatNumber(row.voters)}</Num>
                <td>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Meter value={row.voters_attempted} max={row.voters} label={`${row.precinct} coverage`} />
                    <span className="tabular-nums text-ink-2">{formatPercent(rate(row.voters_attempted, row.voters))}</span>
                  </div>
                </td>
                <Num>{formatNumber(row.attempts)}</Num>
                <Num>{formatNumber(row.conversations)}</Num>
                <Num>{formatPercent(rate(row.conversations, row.attempts))}</Num>
                <Num>{formatNumber(row.supporters)}</Num>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card title="By list">
        {lists.length === 0 ? (
          <p className="body-6 text-ink-2">
            No lists yet.{" "}
            <Link href="/lists/new" className={linkClass}>
              Build a segment
            </Link>{" "}
            to cut the first one.
          </p>
        ) : (
          <Table label="By list">
            <thead>
              <tr>
                <th>List</th>
                <th>Type</th>
                <th>Volunteer</th>
                <th>Progress</th>
                <th className="text-right">Attempts</th>
                <th className="text-right">Conversations</th>
                <th className="text-right">Contact rate</th>
              </tr>
            </thead>
            <tbody>
              {lists.map((list) => (
                <tr key={list.id}>
                  <td>
                    <Link href={`/lists/${list.id}`} className={linkClass}>
                      {list.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap">{LIST_KIND_LABELS[list.kind]}</td>
                  <td>{list.volunteer_name ?? <span className="text-ink-2">Unassigned</span>}</td>
                  <td>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <Meter value={list.voters_attempted} max={list.size} label={`${list.name} progress`} />
                      <span className="tabular-nums text-ink-2">
                        {formatNumber(list.voters_attempted)} / {formatNumber(list.size)}
                      </span>
                    </div>
                  </td>
                  <Num>{formatNumber(list.attempts)}</Num>
                  <Num>{formatNumber(list.conversations)}</Num>
                  <Num>{formatPercent(rate(list.conversations, list.attempts))}</Num>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="caption-1 text-ink-2">{label}</p>
      <p className="mt-2 heading-5">{value}</p>
      {note && <p className="caption-5 text-ink-2">{note}</p>}
    </div>
  );
}
