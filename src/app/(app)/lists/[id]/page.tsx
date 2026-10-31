import { CheckCircle, PersonSimpleWalk } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { ListDetailSkeleton } from "@/components/skeletons";
import { BackLink, buttonClass, EmptyState, Num, Table, Tag } from "@/components/ui";
import { LIST_KIND_LABELS, PARTY_LABELS, SUPPORT_LABELS, type ListKind } from "@/lib/constants";
import { OUTCOME_TONES, SHORT_OUTCOME_LABELS } from "@/lib/display";
import { formatDateTime, formatNumber, formatPercent, formatPhone, rate } from "@/lib/format";
import { getListSummary, getListVoters, type ListSummary, type ListVoterRow } from "@/lib/lists";
import { describeSegment } from "@/lib/segments";
import { listVolunteers } from "@/lib/volunteers";
import { AssignForm } from "../assign-form";

export const metadata: Metadata = { title: "List" };

export default function ListPage(props: PageProps<"/lists/[id]">) {
  return (
    <Suspense fallback={<ListDetailSkeleton />}>
      <ListDetail {...props} />
    </Suspense>
  );
}

// Words that change with the kind of list: doors get knocked, voters get called.
const WORDS: Record<ListKind, { unit: string; done: string; order: string }> = {
  door: { unit: "doors", done: "knocked", order: "walk" },
  phone: { unit: "voters", done: "called", order: "call" },
};

async function ListDetail({ params, searchParams }: PageProps<"/lists/[id]">) {
  await connection();
  const listId = Number((await params).id);
  if (!Number.isInteger(listId) || listId <= 0) notFound();
  const remainingOnly = (await searchParams).show === "remaining";

  // Everyone is loaded either way: the walk strip draws the whole list, the table shows the filter.
  const [list, everyone, volunteers] = await Promise.all([getListSummary(listId), getListVoters(listId), listVolunteers()]);
  if (!list) notFound();

  const remaining = everyone.filter((voter) => voter.last_outcome !== "reached");
  const voters = remainingOnly ? remaining : everyone;
  const words = WORDS[list.kind];
  const assigned = list.volunteer_id !== null;

  return (
    <>
      <div className="mb-2">
        <BackLink href="/lists">Lists</BackLink>
      </div>

      {/* The walk sheet: one piece of card stock with the head, the tally, a tear off stub for
          the volunteer, and every door in walk order. */}
      <article className="min-w-0 overflow-hidden rounded-2xl border border-line bg-paper">
        <header className="flex flex-wrap items-start justify-between gap-4 px-4 pt-6 sm:px-6">
          <div className="min-w-0">
            {/* Names run up to 120 characters; a long one prints smaller so it stays a few lines on a phone. */}
            <h1 className={`${list.name.length > 40 ? "heading-5 sm:heading-4" : "heading-3"} [overflow-wrap:anywhere]`}>{list.name}</h1>
            <p className="mt-2 max-w-2xl body-3 [overflow-wrap:anywhere] text-ink-2">{describeSegment(list.segment)}</p>
            <p className="mt-1 caption-2 text-muted">
              {LIST_KIND_LABELS[list.kind]} in {words.order} order, created {formatDateTime(list.created_at)}
            </p>
          </div>
          {assigned && (
            <Link href={`/lists/${list.id}/canvass`} className={buttonClass}>
              <PersonSimpleWalk size={16} aria-hidden />
              Open canvass view
            </Link>
          )}
        </header>

        <section aria-label="Progress" className="px-4 pt-8 pb-6 sm:px-6">
          <Tally list={list} />
          <WalkStrip voters={everyone} kind={list.kind} />
        </section>

        <section
          aria-label="Volunteer"
          className="flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-line px-4 py-4 sm:px-6"
        >
          <div className="min-w-0">
            <h2 className="title-3">Volunteer</h2>
            <p className="mt-1 caption-2 text-muted">
              {assigned
                ? `Attempts logged on this list are credited to ${list.volunteer_name}.`
                : "Assign this list to start logging contacts."}
            </p>
          </div>
          <AssignForm
            listId={list.id}
            listName={list.name}
            volunteerId={list.volunteer_id}
            volunteers={volunteers}
            className="w-full sm:w-80"
          />
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft px-4 py-4 sm:px-6">
          <nav aria-label="Filter voters" className="flex gap-1 rounded-lg bg-soft p-1">
            <FilterLink href={`/lists/${list.id}`} active={!remainingOnly} count={everyone.length}>
              Everyone
            </FilterLink>
            <FilterLink href={`/lists/${list.id}?show=remaining`} active={remainingOnly} count={remaining.length}>
              Not yet reached
            </FilterLink>
          </nav>
          <p className="caption-2 text-muted">In {words.order} order</p>
        </div>

        {voters.length === 0 ? (
          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            <EmptyState icon={<CheckCircle size={24} aria-hidden />} title="Everyone on this list has been reached">
              Switch to Everyone to see each conversation, or cut a new list from the voters still left.
            </EmptyState>
          </div>
        ) : (
          <VoterTable voters={voters} kind={list.kind} />
        )}
      </article>
    </>
  );
}

/** The totals, set as a sentence with the numbers in condensed figures. Conversations get the orange ink. */
function Tally({ list }: { list: ListSummary }) {
  const words = WORDS[list.kind];
  const contactRate = rate(list.conversations, list.attempts);

  return (
    <div className="flex flex-col gap-2 body-2 text-ink-2">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <Figure>{formatNumber(list.voters_attempted)}</Figure>
        <span>of</span>
        <Figure>{formatNumber(list.size)}</Figure>
        <span>
          {words.unit} {words.done}
        </span>
      </p>
      {contactRate === null ? (
        <p>No attempts logged yet</p>
      ) : (
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Figure stamp={list.conversations > 0}>{formatNumber(list.conversations)}</Figure>
          <span>{list.conversations === 1 ? "conversation" : "conversations"} from</span>
          <Figure>{formatNumber(list.attempts)}</Figure>
          <span>{list.attempts === 1 ? "attempt," : "attempts,"} a contact rate of</span>
          <Figure>{formatPercent(contactRate)}</Figure>
        </p>
      )}
    </div>
  );
}

function Figure({ stamp = false, children }: { stamp?: boolean; children: ReactNode }) {
  return stamp ? (
    <span className="figure inline-block rounded-md bg-orange px-2 pt-1 pb-0.5 text-4xl text-ink">{children}</span>
  ) : (
    <span className="figure text-4xl text-ink">{children}</span>
  );
}

type DoorState = "reached" | "attempted" | "untouched";

const DOOR_INK: Record<DoorState, string> = {
  reached: "bg-orange",
  attempted: "bg-indigo",
  untouched: "bg-soft",
};

const doorState = (voter: ListVoterRow): DoorState =>
  voter.last_outcome === "reached" ? "reached" : voter.attempts > 0 ? "attempted" : "untouched";

/**
 * Every door on the list in walk order, printed in two inks: indigo where someone knocked,
 * orange where it turned into a conversation, bare stock where nobody has been yet.
 * Short lists get one mark per door; long ones merge neighbors into runs.
 */
function WalkStrip({ voters, kind }: { voters: ListVoterRow[]; kind: ListKind }) {
  const words = WORDS[kind];
  const states = voters.map(doorState);
  const counts = { reached: 0, attempted: 0, untouched: 0 };
  for (const state of states) counts[state] += 1;

  const perDoor = states.length <= 80;
  const runs: { state: DoorState; length: number; start: number }[] = [];
  states.forEach((state, index) => {
    const last = runs.at(-1);
    if (!perDoor && last && last.state === state) last.length += 1;
    else runs.push({ state, length: 1, start: index });
  });

  const keys: [DoorState, string][] = [
    ["reached", "Reached"],
    ["attempted", `${words.done[0].toUpperCase()}${words.done.slice(1)}, no conversation`],
    ["untouched", `Not ${words.done} yet`],
  ];

  return (
    <div className="mt-6">
      <div
        role="img"
        aria-label={`${words.unit[0].toUpperCase()}${words.unit.slice(1)} in ${words.order} order: ${counts.reached} reached, ${counts.attempted} ${words.done} without a conversation, ${counts.untouched} not ${words.done} yet.`}
        className={`flex h-6 overflow-hidden rounded-md ${perDoor ? "sm:gap-0.5" : ""}`}
      >
        {runs.map((run) => (
          <span key={run.start} className={`min-w-0 basis-0 ${DOOR_INK[run.state]}`} style={{ flexGrow: run.length }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 caption-2 text-ink-2">
        {keys.map(([state, label]) => (
          <li key={state} className="flex items-center gap-2">
            <span aria-hidden className={`size-3 shrink-0 rounded-sm ${DOOR_INK[state]} ${state === "untouched" ? "ring-1 ring-line ring-inset" : ""}`} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "196 Cedar Dr" → house number and street, so the sheet can print each street name once. */
function splitAddress(address: string): { house: string; street: string } {
  const match = /^(\d+\w*)\s+(.+)$/.exec(address.trim());
  return match ? { house: match[1], street: match[2] } : { house: "", street: address };
}

function VoterTable({ voters, kind }: { voters: ListVoterRow[]; kind: ListKind }) {
  const words = WORDS[kind];
  const streets = voters.map((voter) => splitAddress(voter.address).street);

  return (
    <Table
      label="Voters on this list"
      // The sheet's 24px margin carries into the first and last columns from sm up.
      className="border-t border-line-soft sm:[&_td:first-child]:pl-6 sm:[&_td:last-child]:pr-6 sm:[&_th:first-child]:pl-6 sm:[&_th:last-child]:pr-6"
    >
      <thead>
        <tr>
          <th className="w-12">#</th>
          {kind === "door" ? <th>Address</th> : null}
          <th>Voter</th>
          {kind === "phone" ? <th>Phone</th> : null}
          <th>Latest outcome</th>
          <th className="text-right">Attempts</th>
          <th>Last contact</th>
        </tr>
      </thead>
      <tbody>
        {voters.map((voter, index) => {
          const { house, street } = splitAddress(voter.address);
          // Walk order goes one street at a time: the street name prints in full ink where a new one starts.
          const newStreet = index === 0 || streets[index - 1] !== street;

          return (
            <tr key={voter.id}>
              <td className="tabular-nums text-muted">{voter.position}</td>
              {kind === "door" && (
                <td className="min-w-48">
                  <span className="body-4 tabular-nums">{house}</span> <span className={newStreet ? "text-ink" : "text-muted"}>{street}</span>
                </td>
              )}
              <td className="min-w-48">
                <span className="block body-5">
                  {voter.first_name} {voter.last_name}
                </span>
                <span className="caption-5 text-muted">
                  Age {voter.age}, {PARTY_LABELS[voter.party]}, score {voter.support_score}
                </span>
              </td>
              {kind === "phone" && <td className="whitespace-nowrap tabular-nums">{formatPhone(voter.phone)}</td>}
              <td className="min-w-56">
                {voter.last_outcome ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <Tag tone={OUTCOME_TONES[voter.last_outcome]}>{SHORT_OUTCOME_LABELS[voter.last_outcome]}</Tag>
                    {voter.last_support !== null && (
                      <span className="caption-2 whitespace-nowrap text-ink-2">
                        {voter.last_support} · {SUPPORT_LABELS[voter.last_support]}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="caption-2 text-muted">Not {words.done} yet</span>
                )}
                {/* Notes run up to 500 characters: two lines here, the whole note on hover. */}
                {voter.last_notes && (
                  <span title={voter.last_notes} className="mt-1 line-clamp-2 max-w-64 caption-5 whitespace-pre-line text-muted">
                    Note: {voter.last_notes}
                  </span>
                )}
              </td>
              <Num>{voter.attempts}</Num>
              <td className="whitespace-nowrap caption-2 text-muted">
                {voter.last_contact_at ? formatDateTime(voter.last_contact_at) : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

function FilterLink({ href, active, count, children }: { href: string; active: boolean; count: number; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2 rounded px-3 py-1 caption-1 transition duration-150 ease-out ${
        active ? "bg-paper text-ink" : "text-ink-2 hover:text-ink"
      }`}
    >
      {children}
      <span className="caption-4 tabular-nums text-ink-2">{formatNumber(count)}</span>
    </Link>
  );
}
