import { CheckCircle, DoorOpen, Phone } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { ListDetailSkeleton } from "@/components/skeletons";
import { Card, EmptyState, linkClass, Meter, PageHeader } from "@/components/ui";
import { LIST_KIND_LABELS, OUTCOME_LABELS, PARTY_LABELS, SUPPORT_LABELS, type ListKind } from "@/lib/constants";
import { formatDateTime, formatNumber, formatPercent, formatPhone, rate } from "@/lib/format";
import { getListSummary, getListVoters, type ListVoterRow } from "@/lib/lists";
import { describeSegment } from "@/lib/segments";
import { listVolunteers } from "@/lib/volunteers";
import { AssignForm } from "../assign-form";
import { ContactForm } from "./contact-form";

export default function ListPage(props: PageProps<"/lists/[id]">) {
  return (
    <Suspense fallback={<ListDetailSkeleton />}>
      <ListDetail {...props} />
    </Suspense>
  );
}

async function ListDetail({ params, searchParams }: PageProps<"/lists/[id]">) {
  await connection();
  const listId = Number((await params).id);
  if (!Number.isInteger(listId) || listId <= 0) notFound();
  const remainingOnly = (await searchParams).show === "remaining";

  const [list, voters, volunteers] = await Promise.all([
    getListSummary(listId),
    getListVoters(listId, { remainingOnly }),
    listVolunteers(),
  ]);
  if (!list) notFound();

  const KindIcon = list.kind === "door" ? DoorOpen : Phone;

  return (
    <>
      <Link href="/lists" className={`${linkClass} mb-4 inline-block body-6`}>
        All lists
      </Link>
      <PageHeader
        title={list.name}
        description={
          <>
            <span className="inline-flex items-center gap-2 align-middle">
              <KindIcon size={16} aria-hidden />
              {LIST_KIND_LABELS[list.kind]}
            </span>{" "}
            · {describeSegment(list.segment)} · created {formatDateTime(list.created_at)}
          </>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Voters" value={formatNumber(list.size)} />
            <Stat
              label="Attempted"
              value={
                <span className="flex items-center gap-2">
                  {formatNumber(list.voters_attempted)}
                  <Meter value={list.voters_attempted} max={list.size} label="List progress" />
                </span>
              }
            />
            <Stat label="Conversations" value={formatNumber(list.conversations)} />
            <Stat label="Contact rate" value={formatPercent(rate(list.conversations, list.attempts))} />
          </dl>
        </Card>
        <Card>
          <h2 className="mb-3 title-3">Volunteer</h2>
          <AssignForm listId={list.id} listName={list.name} volunteerId={list.volunteer_id} volunteers={volunteers} />
          {list.volunteer_id === null && (
            <p className="mt-3 caption-2 text-ink-2">Assign this list to start logging contacts.</p>
          )}
        </Card>
      </div>

      <nav aria-label="Filter voters" className="mb-4 flex gap-2">
        <FilterLink href={`/lists/${list.id}`} active={!remainingOnly}>
          Everyone
        </FilterLink>
        <FilterLink href={`/lists/${list.id}?show=remaining`} active={remainingOnly}>
          Not yet reached
        </FilterLink>
      </nav>

      {voters.length === 0 ? (
        <EmptyState icon={<CheckCircle size={24} aria-hidden />} title="Everyone on this list has been reached">
          Switch to Everyone to see each conversation, or cut a new list from the voters still left.
        </EmptyState>
      ) : (
        <ol aria-label="Voters on this list" className="grid gap-2">
          {voters.map((voter) => (
            <li key={voter.id} className="rounded-2xl border border-line bg-surface p-4">
              <VoterSummary voter={voter} kind={list.kind} />
              <div className="mt-4">
                <ContactForm
                  listId={list.id}
                  voterId={voter.id}
                  voterName={`${voter.first_name} ${voter.last_name}`}
                  disabled={list.volunteer_id === null}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function VoterSummary({ voter, kind }: { voter: ListVoterRow; kind: ListKind }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="caption-2 tabular-nums text-ink-2">{voter.position}.</span>
        <span className="title-3">
          {voter.first_name} {voter.last_name}
        </span>
        <span className="body-6">{kind === "door" ? voter.address : formatPhone(voter.phone)}</span>
        <span className="caption-2 text-ink-2">
          {voter.age} · {PARTY_LABELS[voter.party]} · score {voter.support_score}
          {kind === "door" && voter.phone && ` · ${formatPhone(voter.phone)}`}
        </span>
      </div>
      <div className="caption-2 text-ink-2">
        {voter.last_outcome === null ? (
          "Not attempted"
        ) : (
          <>
            <span className="caption-1 text-ink">{OUTCOME_LABELS[voter.last_outcome]}</span>
            {voter.last_support !== null && ` · ${voter.last_support} ${SUPPORT_LABELS[voter.last_support]}`}
            {` · ${voter.attempts} ${voter.attempts === 1 ? "attempt" : "attempts"}`}
            {voter.last_contact_at && ` · ${formatDateTime(voter.last_contact_at)}`}
            {voter.last_notes && <span className="mt-1 block text-ink">Note: {voter.last_notes}</span>}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="caption-1 text-ink-2">{label}</dt>
      <dd className="mt-1 heading-6">{value}</dd>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-3 py-2 title-4 transition ${
        active ? "border-line bg-raised text-ink" : "border-transparent text-ink-2 hover:bg-raised hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
