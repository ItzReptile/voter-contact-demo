import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { Card, linkClass, Loading, Meter, PageHeader } from "@/components/ui";
import { LIST_KIND_LABELS, OUTCOME_LABELS, PARTY_LABELS, SUPPORT_LABELS } from "@/lib/constants";
import { formatDateTime, formatNumber, formatPercent, formatPhone, rate } from "@/lib/format";
import { getListSummary, getListVoters, type ListVoterRow } from "@/lib/lists";
import { describeSegment } from "@/lib/segments";
import { listVolunteers } from "@/lib/volunteers";
import { AssignForm } from "../assign-form";
import { ContactForm } from "./contact-form";

export default function ListPage(props: PageProps<"/lists/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
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

  return (
    <>
      <PageHeader
        title={list.name}
        description={`${LIST_KIND_LABELS[list.kind]} · ${describeSegment(list.segment)} · created ${formatDateTime(list.created_at)}`}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
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
        <Card title="Volunteer">
          <AssignForm listId={list.id} listName={list.name} volunteerId={list.volunteer_id} volunteers={volunteers} />
          {list.volunteer_id === null && (
            <p className="mt-2 text-sm text-ink-2">Assign this list to start logging contacts.</p>
          )}
        </Card>
      </div>

      <nav aria-label="Filter voters" className="mb-3 flex gap-4 text-sm">
        <FilterLink href={`/lists/${list.id}`} active={!remainingOnly}>
          Everyone
        </FilterLink>
        <FilterLink href={`/lists/${list.id}?show=remaining`} active={remainingOnly}>
          Not yet reached
        </FilterLink>
      </nav>

      <ol aria-label="Voters on this list" className="grid gap-2">
        {voters.map((voter) => (
          <li key={voter.id} className="rounded-lg border border-line bg-surface p-3">
            <VoterSummary voter={voter} kind={list.kind} />
            <div className="mt-3">
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
      {voters.length === 0 && <p className="text-sm text-ink-2">Everyone on this list has been reached.</p>}
    </>
  );
}

function VoterSummary({ voter, kind }: { voter: ListVoterRow; kind: "door" | "phone" }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <span className="mr-2 text-sm tabular-nums text-ink-2">{voter.position}.</span>
        <span className="font-medium">
          {voter.first_name} {voter.last_name}
        </span>
        <span className="ml-3 text-sm">{kind === "door" ? voter.address : formatPhone(voter.phone)}</span>
        <span className="ml-3 text-sm text-ink-2">
          {voter.age} · {PARTY_LABELS[voter.party]} · score {voter.support_score}
          {kind === "door" && voter.phone && ` · ${formatPhone(voter.phone)}`}
        </span>
      </div>
      <div className="text-sm text-ink-2">
        {voter.last_outcome === null ? (
          "Not attempted"
        ) : (
          <>
            <span className="font-medium text-ink">{OUTCOME_LABELS[voter.last_outcome]}</span>
            {voter.last_support !== null && ` · ${voter.last_support} ${SUPPORT_LABELS[voter.last_support]}`}
            {` · ${voter.attempts} ${voter.attempts === 1 ? "attempt" : "attempts"}`}
            {voter.last_contact_at && ` · ${formatDateTime(voter.last_contact_at)}`}
            {voter.last_notes && <span className="block italic">“{voter.last_notes}”</span>}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-2">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={active ? "font-medium" : linkClass}>
      {children}
    </Link>
  );
}
