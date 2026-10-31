import { ChartBar, DoorOpen, Phone } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { DailyColumns, Legend, RateTags, type Ink } from "@/components/charts";
import { DashboardSkeleton } from "@/components/skeletons";
import { StackedBar } from "@/components/stacked-bar";
import { buttonClass, EmptyState, Hanger, linkClass, Meter, Num, PageHeader, Table, Tag } from "@/components/ui";
import { SUPPORT_LABELS, SUPPORT_LEVELS, type Outcome } from "@/lib/constants";
import { getAttemptsByDay, getPrecinctStats, getSupportCounts, getTotals, type Totals } from "@/lib/dashboard";
import { OUTCOME_ORDER, SHORT_OUTCOME_LABELS } from "@/lib/display";
import { formatNumber, formatPercent, rate } from "@/lib/format";
import { getListSummaries } from "@/lib/lists";

export const metadata: Metadata = { title: "Dashboard" };

// The report prints in two inks: conversations in orange on the baseline, every other attempt in
// indigo above. The tooltips and the screen reader table still break the indigo down by outcome.
const INKS: Ink<Outcome>[] = [
  { label: "Conversations", color: "var(--orange)", parts: [{ key: "reached", label: SHORT_OUTCOME_LABELS.reached }] },
  {
    label: "Other attempts",
    color: "var(--indigo)",
    parts: OUTCOME_ORDER.filter((outcome) => outcome !== "reached").map((key) => ({ key, label: SHORT_OUTCOME_LABELS[key] })),
  },
];

const plural = (count: number, one: string, other: string) => `${formatNumber(count)} ${count === 1 ? one : other}`;

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" />
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

  const ids = SUPPORT_LEVELS.reduce((sum, level) => sum + supports[level], 0);

  return (
    <div className="flex min-w-0 flex-col gap-12 lg:gap-16">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 md:grid-cols-[18rem_minmax(0,1fr)] lg:grid-cols-[22rem_minmax(0,1fr)]">
        <ContactRate totals={totals} />

        <section aria-labelledby="dashboard-attempts" className="flex min-w-0 flex-col justify-between gap-8">
          <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
            <SectionHeading id="dashboard-attempts" title="Attempts per day">
              Last 14 days
            </SectionHeading>
            <Legend inks={INKS} days={days} />
          </div>
          <DailyColumns
            label="Attempts per day, last 14 days"
            days={days}
            inks={INKS}
            emptyText="No knocks or calls logged in the last 14 days."
          />
        </section>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section aria-labelledby="dashboard-support" className="flex max-w-xl min-w-0 flex-col gap-6">
          <SectionHeading id="dashboard-support" title="Support IDs">
            {ids === 0 ? "None yet. A support ID is recorded in a conversation." : `${plural(ids, "ID", "IDs")} from conversations`}
          </SectionHeading>
          <StackedBar
            label="Support IDs, from 1 strong support to 5 strong oppose"
            ends={["Support", "Oppose"]}
            segments={SUPPORT_LEVELS.map((level) => ({
              key: String(level),
              mark: String(level),
              markColor: level === 5 ? "var(--paper)" : "var(--ink)",
              label: SUPPORT_LABELS[level],
              value: supports[level],
              color: `var(--support-${level})`,
            }))}
          />
        </section>

        <section aria-labelledby="dashboard-lists" className="flex min-w-0 flex-col gap-6">
          <SectionHeading id="dashboard-lists" title="Lists">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Meter value={totals.voters_on_lists} max={totals.voters} label="Voters on a list" />
              {formatNumber(totals.voters_on_lists)} of {plural(totals.voters, "voter", "voters")} are on a list
            </span>
          </SectionHeading>
          {lists.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line px-6 py-8 body-6 text-ink-2">
              No lists yet.{" "}
              <Link href="/lists/new" className={linkClass}>
                Create the first one
              </Link>
              .
            </p>
          ) : (
            <Surface>
              <Table label="By list">
                <thead>
                  <tr>
                    <th>List</th>
                    <th>Attempted</th>
                    <th className="text-right">Contact rate</th>
                  </tr>
                </thead>
                <tbody>
                  {lists.map((list) => (
                    <tr key={list.id}>
                      <td>
                        <Link href={`/lists/${list.id}`} className="flex items-start gap-2 body-5 hover:text-indigo hover:underline">
                          {list.kind === "door" ? (
                            <DoorOpen size={16} className="mt-0.5 shrink-0 text-muted" aria-label="Door knocking" />
                          ) : (
                            <Phone size={16} className="mt-0.5 shrink-0 text-muted" aria-label="Phone calls" />
                          )}
                          <span className="sm:min-w-40">{list.name}</span>
                        </Link>
                        <span className="mt-1 block pl-6 caption-5 text-muted">
                          {list.volunteer_name ?? <Tag tone="ink">Unassigned</Tag>}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          <Meter
                            value={list.voters_attempted}
                            max={list.size}
                            label={`${list.name} progress`}
                            className="hidden w-20 sm:block"
                          />
                          <span className="caption-2 tabular-nums text-ink-2">
                            {formatNumber(list.voters_attempted)} / {formatNumber(list.size)}
                          </span>
                        </div>
                      </td>
                      <Num>{formatPercent(rate(list.conversations, list.attempts))}</Num>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Surface>
          )}
        </section>
      </div>

      <section aria-labelledby="dashboard-precincts" className="flex min-w-0 flex-col gap-6">
        <SectionHeading id="dashboard-precincts" title="Precincts">
          Contact rate in each precinct. The orange part of a tag is the share of attempts that became a conversation.
        </SectionHeading>
        <RateTags
          label="Contact rate per precinct"
          rows={precincts.map((row) => ({
            key: row.precinct,
            label: row.precinct,
            part: row.conversations,
            whole: row.attempts,
            detail: row.attempts === 0 ? "No attempts yet" : plural(row.attempts, "attempt", "attempts"),
          }))}
        />
        <Surface>
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
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <Meter value={row.voters_attempted} max={row.voters} label={`${row.precinct} coverage`} className="w-20" />
                      <span className="caption-2 tabular-nums text-ink-2">{formatPercent(rate(row.voters_attempted, row.voters))}</span>
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
        </Surface>
      </section>
    </div>
  );
}

/**
 * The one loud thing: the contact rate printed on a door hanger, in indigo, with the
 * conversations on an orange band underneath, the way the real hanger prints its message.
 */
function ContactRate({ totals }: { totals: Totals }) {
  return (
    <section aria-label="Contact rate" className="min-w-0">
      <Hanger className="@container flex h-full flex-col pb-6">
        {totals.attempts === 0 ? (
          <div className="px-6">
            <h2 className="heading-4">No attempts yet</h2>
            <p className="mt-2 body-6 text-ink-2">
              The contact rate shows up here after the first knock or call. Assign a list to a volunteer to get started.
            </p>
            <Link href="/lists" className={`${buttonClass} mt-6`}>
              Go to lists
            </Link>
          </div>
        ) : (
          <>
            <p className="px-6">
              {/* 128px once the hanger is wide enough for "100%", 96px on narrow hangers. */}
              <span className="block figure text-8xl text-indigo @[21rem]:text-9xl">
                {formatPercent(rate(totals.conversations, totals.attempts))}
              </span>
              <span className="mt-3 block title-2">
                of {plural(totals.attempts, "knock or call", "knocks and calls")} became a conversation.
              </span>
            </p>
            <p className="mt-6 bg-orange px-6 py-3 title-3 text-ink">
              <span className="block">{plural(totals.conversations, "conversation", "conversations")}</span>
              <span className="block">{plural(totals.supporters, "supporter", "supporters")} identified</span>
            </p>
          </>
        )}
        <p className="mt-auto px-6 pt-6 caption-2 text-muted">
          Contact rate is conversations divided by attempts. Supporters are voters who gave a 1&nbsp;or&nbsp;2.
        </p>
      </Hanger>
    </section>
  );
}

function SectionHeading({ id, title, children }: { id: string; title: string; children?: ReactNode }) {
  return (
    <div className="min-w-0">
      <h2 id={id} className="heading-5">
        {title}
      </h2>
      {children && <div className="mt-1 caption-2 text-muted">{children}</div>}
    </div>
  );
}

/** Paper for a dense table: tables need white under them; the rest of the report sits on card stock. */
function Surface({ children }: { children: ReactNode }) {
  return <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-paper">{children}</div>;
}
