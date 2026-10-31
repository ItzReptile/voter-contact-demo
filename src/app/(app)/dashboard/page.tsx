import { ChartBar, DoorOpen, Phone } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { DailyColumns, Legend, RateBars, Sparkline, type Series } from "@/components/charts";
import { DashboardSkeleton } from "@/components/skeletons";
import { StackedBar } from "@/components/stacked-bar";
import { Card, EmptyState, linkClass, Meter, Num, PageHeader, Table, Tag } from "@/components/ui";
import { SUPPORT_LABELS, SUPPORT_LEVELS, type Outcome } from "@/lib/constants";
import { getAttemptsByDay, getPrecinctStats, getSupportCounts, getTotals } from "@/lib/dashboard";
import { OUTCOME_COLORS, SHORT_OUTCOME_LABELS } from "@/lib/display";
import { formatNumber, formatPercent, rate } from "@/lib/format";
import { getListSummaries } from "@/lib/lists";

export const metadata: Metadata = { title: "Dashboard" };

const OUTCOME_SERIES: Series<Outcome>[] = (["reached", "not_home", "moved", "wrong_number"] as const).map((key) => ({
  key,
  label: SHORT_OUTCOME_LABELS[key],
  color: OUTCOME_COLORS[key],
}));

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
  const [totals, supports, precincts, lists, days] = await Promise.all([
    getTotals(),
    getSupportCounts(),
    getPrecinctStats(),
    getListSummaries(),
    getAttemptsByDay(14),
  ]);

  if (totals.voters === 0) {
    return (
      <EmptyState
        icon={<ChartBar size={24} aria-hidden />}
        title="No voters yet"
        action={{ href: "/voters/import", label: "Import a voter file" }}
      >
        Import a CSV to fill the dashboard, or run npm run seed to load the demo data.
      </EmptyState>
    );
  }

  const attemptsPerDay = days.map((day) => day.reached + day.not_home + day.moved + day.wrong_number);
  const outcomeTotals = {
    reached: days.reduce((sum, day) => sum + day.reached, 0),
    not_home: days.reduce((sum, day) => sum + day.not_home, 0),
    moved: days.reduce((sum, day) => sum + day.moved, 0),
    wrong_number: days.reduce((sum, day) => sum + day.wrong_number, 0),
  };
  const ids = SUPPORT_LEVELS.reduce((sum, level) => sum + supports[level], 0);
  const worked = precincts.filter((row) => row.attempts > 0).sort((a, b) => b.attempts - a.attempts);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section aria-label="Totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Contact rate" value={formatPercent(rate(totals.conversations, totals.attempts))} hero>
          <p className="caption-2 text-muted">
            {formatNumber(totals.conversations)} conversations from {formatNumber(totals.attempts)} attempts
          </p>
        </Kpi>
        <Kpi label="Attempts" value={formatNumber(totals.attempts)}>
          <Sparkline values={attemptsPerDay} color="var(--accent)" label="Attempts per day, last 14 days" />
        </Kpi>
        <Kpi label="Conversations" value={formatNumber(totals.conversations)}>
          <Sparkline values={days.map((day) => day.reached)} color="var(--teal)" label="Conversations per day, last 14 days" />
        </Kpi>
        <Kpi label="Supporters ID'd" value={formatNumber(totals.supporters)}>
          <div className="grid gap-2 caption-2 text-muted">
            <Meter value={totals.voters_on_lists} max={totals.voters} label="Voters on a list" className="w-full" />
            {formatNumber(totals.voters_on_lists)} of {formatNumber(totals.voters)} voters are on a list
          </div>
        </Kpi>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card
          title="Attempts per day"
          description="Last 14 days, by outcome"
          className="xl:col-span-2"
          action={<Legend series={OUTCOME_SERIES} totals={outcomeTotals} />}
        >
          <DailyColumns label="Attempts per day, last 14 days" days={days} series={OUTCOME_SERIES} />
        </Card>
        <Card title="Support IDs" description={`${formatNumber(ids)} IDs from conversations`}>
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

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Contact rate by precinct" description="Precincts with at least one attempt, most worked first">
          {worked.length === 0 ? (
            <p className="body-6 text-muted">No attempts yet.</p>
          ) : (
            <RateBars
              label="Contact rate by precinct"
              rows={worked.map((row) => ({
                key: row.precinct,
                label: row.precinct,
                part: row.conversations,
                whole: row.attempts,
                detail: `${formatNumber(row.conversations)} of ${formatNumber(row.attempts)} attempts`,
              }))}
            />
          )}
        </Card>

        <Card title="Lists" description="Voters attempted at least once" padded={false}>
          {lists.length === 0 ? (
            <p className="px-6 pb-6 body-6 text-muted">
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
                  <th>Progress</th>
                  <th className="text-right">Contact rate</th>
                </tr>
              </thead>
              <tbody>
                {lists.map((list) => (
                  <tr key={list.id}>
                    <td>
                      <Link href={`/lists/${list.id}`} className="flex items-center gap-2 body-5 hover:underline">
                        {list.kind === "door" ? (
                          <DoorOpen size={16} className="shrink-0 text-muted" aria-label="Door knocking" />
                        ) : (
                          <Phone size={16} className="shrink-0 text-muted" aria-label="Phone calls" />
                        )}
                        <span className="min-w-40">{list.name}</span>
                      </Link>
                      <span className="mt-1 block caption-5 text-muted">
                        {list.volunteer_name ?? <Tag tone="orange">Unassigned</Tag>}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Meter value={list.voters_attempted} max={list.size} label={`${list.name} progress`} className="w-20" />
                        <span className="caption-2 tabular-nums text-muted">
                          {formatNumber(list.voters_attempted)} / {formatNumber(list.size)}
                        </span>
                      </div>
                    </td>
                    <Num>{formatPercent(rate(list.conversations, list.attempts))}</Num>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      <Card title="By precinct" description="Every precinct in the file" padded={false}>
        <Table label="By precinct">
          <thead>
            <tr>
              <th>Precinct</th>
              <th className="text-right">Voters</th>
              <th>Coverage</th>
              <th className="text-right">Attempts</th>
              <th className="text-right">Conversations</th>
              <th className="text-right">Contact rate</th>
              <th className="text-right">Supporters</th>
            </tr>
          </thead>
          <tbody>
            {precincts.map((row) => (
              <tr key={row.precinct}>
                <td className="body-5">{row.precinct}</td>
                <Num>{formatNumber(row.voters)}</Num>
                <td>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Meter value={row.voters_attempted} max={row.voters} label={`${row.precinct} coverage`} className="w-20" />
                    <span className="caption-2 tabular-nums text-muted">{formatPercent(rate(row.voters_attempted, row.voters))}</span>
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
    </div>
  );
}

function Kpi({ label, value, hero = false, children }: { label: string; value: string; hero?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-surface p-6">
      <div>
        <p className="caption-1 text-muted">{label}</p>
        <p className={`mt-2 tabular-nums ${hero ? "heading-3 text-accent" : "heading-4"}`}>{value}</p>
      </div>
      {children}
    </div>
  );
}
