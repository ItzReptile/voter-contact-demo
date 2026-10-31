import { CheckCircle, DoorOpen, Phone, PersonSimpleWalk } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { ListDetailSkeleton } from "@/components/skeletons";
import { buttonClass, EmptyState, Meter, Num, PageHeader, Table, Tag } from "@/components/ui";
import { LIST_KIND_LABELS, SUPPORT_LABELS } from "@/lib/constants";
import { OUTCOME_TONES, SHORT_OUTCOME_LABELS } from "@/lib/display";
import { formatDateTime, formatNumber, formatPercent, formatPhone, rate } from "@/lib/format";
import { getListSummary, getListVoters } from "@/lib/lists";
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
  const assigned = list.volunteer_id !== null;

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/lists" className="caption-1 text-muted transition hover:text-ink">
            Lists
          </Link>
        }
        title={list.name}
        description={
          <>
            <span className="inline-flex items-center gap-1 align-middle">
              <KindIcon size={14} aria-hidden />
              {LIST_KIND_LABELS[list.kind]}
            </span>{" "}
            · {describeSegment(list.segment)} · created {formatDateTime(list.created_at)}
          </>
        }
        actions={
          assigned ? (
            <Link href={`/lists/${list.id}/canvass`} className={buttonClass}>
              <PersonSimpleWalk size={16} aria-hidden />
              Open canvass view
            </Link>
          ) : null
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Voters">{formatNumber(list.size)}</Stat>
        <Stat label="Attempted">
          <span className="flex items-center gap-3">
            {formatNumber(list.voters_attempted)}
            <Meter value={list.voters_attempted} max={list.size} label="List progress" className="w-20" />
          </span>
        </Stat>
        <Stat label="Conversations">{formatNumber(list.conversations)}</Stat>
        <Stat label="Contact rate">{formatPercent(rate(list.conversations, list.attempts))}</Stat>
      </div>

      <section aria-label="Volunteer" className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-subtle p-4">
        <div>
          <h2 className="title-4">Volunteer</h2>
          <p className="mt-1 caption-2 text-muted">
            {assigned
              ? "Attempts logged on this list are credited to them."
              : "Assign this list to start logging contacts."}
          </p>
        </div>
        <AssignForm listId={list.id} listName={list.name} volunteerId={list.volunteer_id} volunteers={volunteers} />
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <nav aria-label="Filter voters" className="flex gap-1 rounded-lg bg-hover p-1">
          <FilterLink href={`/lists/${list.id}`} active={!remainingOnly}>
            Everyone
          </FilterLink>
          <FilterLink href={`/lists/${list.id}?show=remaining`} active={remainingOnly}>
            Not yet reached
          </FilterLink>
        </nav>
        <p className="caption-2 text-muted">In {list.kind === "door" ? "walk" : "call"} order</p>
      </div>

      {voters.length === 0 ? (
        <EmptyState icon={<CheckCircle size={24} aria-hidden />} title="Everyone on this list has been reached">
          Switch to Everyone to see each conversation, or cut a new list from the voters still left.
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          <Table label="Voters on this list">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Voter</th>
                <th>{list.kind === "door" ? "Address" : "Phone"}</th>
                <th>Latest outcome</th>
                <th className="text-right">Attempts</th>
                <th>Last contact</th>
              </tr>
            </thead>
            <tbody>
              {voters.map((voter) => (
                <tr key={voter.id}>
                  <td className="tabular-nums text-faint">{voter.position}</td>
                  <td className="whitespace-nowrap">
                    <span className="block body-5">
                      {voter.first_name} {voter.last_name}
                    </span>
                    <span className="caption-5 text-muted">
                      {voter.age} · {voter.party} · score {voter.support_score}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">{list.kind === "door" ? voter.address : formatPhone(voter.phone)}</td>
                  <td>
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
                      <span className="caption-2 text-faint">Not attempted</span>
                    )}
                    {voter.last_notes && <span className="mt-1 block max-w-64 caption-5 text-muted">Note: {voter.last_notes}</span>}
                  </td>
                  <Num>{voter.attempts}</Num>
                  <td className="whitespace-nowrap caption-2 text-muted">
                    {voter.last_contact_at ? formatDateTime(voter.last_contact_at) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <p className="caption-1 text-muted">{label}</p>
      <p className="mt-1 heading-6 tabular-nums">{children}</p>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-md px-3 py-1 caption-1 transition ${active ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
    >
      {children}
    </Link>
  );
}
