import { DoorOpen, ListChecks, Phone, Plus } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { ListsSkeleton } from "@/components/skeletons";
import { buttonClass, EmptyState, Meter, PageHeader } from "@/components/ui";
import { LIST_KIND_LABELS } from "@/lib/constants";
import { formatNumber, formatPercent, rate } from "@/lib/format";
import { getListSummaries, type ListSummary } from "@/lib/lists";
import { describeSegment } from "@/lib/segments";
import { listVolunteers } from "@/lib/volunteers";
import { AssignForm } from "./assign-form";

export const metadata: Metadata = { title: "Lists" };

export default function ListsPage() {
  return (
    <>
      <PageHeader
        title="Lists"
        description="Each list is a snapshot of the voters a segment matched: walk order for doors, alphabetical for calls."
        actions={
          // The header carries New list on wider screens; on a phone it lives in the menu, so repeat it here.
          <Link href="/lists/new" className={`${buttonClass} md:hidden`}>
            <Plus size={16} weight="bold" aria-hidden />
            New list
          </Link>
        }
      />
      <Suspense fallback={<ListsSkeleton />}>
        <ListsSheet />
      </Suspense>
    </>
  );
}

async function ListsSheet() {
  await connection();
  const [lists, volunteers] = await Promise.all([getListSummaries(), listVolunteers()]);

  if (lists.length === 0) {
    return (
      <EmptyState icon={<ListChecks size={24} aria-hidden />} title="No lists yet" action={{ href: "/lists/new", label: "New list" }}>
        A list is who one volunteer will call or visit. Pick precincts, ages and scores, watch the count, then create it.
      </EmptyState>
    );
  }

  // One sheet of card stock, one row per list. No column headers: each figure says what it counts.
  return (
    <ul className="divide-y divide-line-soft rounded-2xl border border-line bg-paper">
      {lists.map((list) => (
        <ListRow key={list.id} list={list} volunteers={volunteers} />
      ))}
    </ul>
  );
}

function ListRow({ list, volunteers }: { list: ListSummary; volunteers: { id: number; name: string }[] }) {
  const KindIcon = list.kind === "door" ? DoorOpen : Phone;
  const done = list.kind === "door" ? "knocked" : "called";
  const contactRate = rate(list.conversations, list.attempts);

  return (
    <li className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_160px_176px_288px] lg:items-center lg:gap-8">
      <div className="min-w-0">
        <Link
          href={`/lists/${list.id}`}
          className="heading-6 [overflow-wrap:anywhere] text-ink underline decoration-transparent underline-offset-4 transition duration-150 ease-out hover:text-indigo hover:decoration-indigo/40"
        >
          {list.name}
        </Link>
        <p className="mt-1 flex items-start gap-2 caption-2 text-muted">
          <KindIcon size={16} className="mt-0.5 shrink-0" aria-label={LIST_KIND_LABELS[list.kind]} />
          <span className="min-w-0 [overflow-wrap:anywhere]">{describeSegment(list.segment)}</span>
        </p>
      </div>

      {/* On a phone the two figures share a line; from lg up they become their own columns. */}
      <div className="grid grid-cols-2 gap-4 lg:contents">
        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="figure text-3xl">{formatNumber(list.voters_attempted)}</span>
            <span className="caption-2 text-muted">
              of {formatNumber(list.size)} {done}
            </span>
          </p>
          <Meter value={list.voters_attempted} max={list.size} label={`${list.name} progress`} className="mt-2 w-full" />
        </div>

        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <Stamp lit={list.conversations > 0}>{formatNumber(list.conversations)}</Stamp>
            <span className="caption-2 text-muted">{list.conversations === 1 ? "conversation" : "conversations"}</span>
          </p>
          <p className="mt-1 caption-2 text-muted">
            {contactRate === null ? "No attempts yet" : `${formatPercent(contactRate)} contact rate`}
          </p>
        </div>
      </div>

      <AssignForm listId={list.id} listName={list.name} volunteerId={list.volunteer_id} volunteers={volunteers} className="w-full" />
    </li>
  );
}

/** Conversations print in the second ink. With none yet, there is nothing to print in orange. */
function Stamp({ lit, children }: { lit: boolean; children: ReactNode }) {
  return (
    <span className={`figure inline-block rounded-md px-2 pt-1 pb-0.5 text-3xl ${lit ? "bg-orange text-ink" : "bg-soft text-ink-2"}`}>
      {children}
    </span>
  );
}
