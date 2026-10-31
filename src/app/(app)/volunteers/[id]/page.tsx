import { DoorOpen, ListChecks, Phone } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ListRackSkeleton } from "@/components/skeletons";
import { BackLink, bigButtonClass, EmptyState, Hanger, Meter, PageHeader, secondaryButtonClass } from "@/components/ui";
import { LIST_KIND_LABELS } from "@/lib/constants";
import { formatNumber, formatPercent, rate } from "@/lib/format";
import { getListsForVolunteer, type ListSummary } from "@/lib/lists";
import { getVolunteer } from "@/lib/volunteers";

export const metadata: Metadata = { title: "My lists" };

// What a volunteer would see after signing in: their lists, how far along each is,
// and one button to pick up where they left off.
export default function VolunteerPage({ params }: PageProps<"/volunteers/[id]">) {
  return (
    <Suspense fallback={<ListRackSkeleton />}>
      <VolunteerLists params={params} />
    </Suspense>
  );
}

async function VolunteerLists({ params }: Pick<PageProps<"/volunteers/[id]">, "params">) {
  await connection();
  const volunteerId = Number((await params).id);
  if (!Number.isInteger(volunteerId) || volunteerId <= 0) notFound();

  const [volunteer, lists] = await Promise.all([getVolunteer(volunteerId), getListsForVolunteer(volunteerId)]);
  if (!volunteer) notFound();

  return (
    <>
      <PageHeader
        eyebrow={
          <BackLink href="/volunteers">Volunteers</BackLink>
        }
        title={<span className="break-words">{volunteer.name}&apos;s lists</span>}
        description="Pick up where you left off. Each tap logs one door or call."
      />
      {lists.length === 0 ? (
        <EmptyState icon={<ListChecks size={24} aria-hidden />} title="Nothing assigned yet" action={{ href: "/lists", label: "Assign a list" }}>
          Lists assigned to {volunteer.name} show up here with how far along each one is.
        </EmptyState>
      ) : (
        // A rack of door hangers, one per list.
        <ul className="grid gap-6 sm:grid-cols-[repeat(auto-fill,minmax(0,20rem))]">
          {lists.map((list) => (
            <li key={list.id} className="flex min-w-0">
              <ListHanger list={list} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ListHanger({ list }: { list: ListSummary }) {
  const door = list.kind === "door";
  const KindIcon = door ? DoorOpen : Phone;
  const left = list.size - list.voters_attempted;
  const noun = door ? (left === 1 ? "door" : "doors") : left === 1 ? "call" : "calls";

  return (
    <Hanger className="flex w-full flex-col overflow-hidden">
      <div className="bg-indigo px-6 pt-4 pb-6 text-white">
        <p className="flex items-center gap-2 caption-1">
          <KindIcon size={16} aria-hidden />
          {LIST_KIND_LABELS[list.kind]}
        </p>
        <h2 className="mt-2 heading-5 break-words">{list.name}</h2>
      </div>

      {/* The orange strip only prints once there is a conversation to count. */}
      {list.conversations > 0 ? (
        <p className="bg-orange px-6 py-2 title-4 text-ink">
          {formatNumber(list.conversations)} {list.conversations === 1 ? "conversation" : "conversations"}
        </p>
      ) : (
        <p className="bg-soft px-6 py-2 title-4 text-ink-2">No conversations yet</p>
      )}

      <div className="flex flex-1 flex-col gap-6 px-6 pt-6 pb-6">
        <div>
          <p className="caption-2 text-muted tabular-nums">
            <span className="heading-3 text-ink">{formatNumber(list.voters_attempted)}</span> of {formatNumber(list.size)} attempted
          </p>
          <Meter value={list.voters_attempted} max={list.size} label={`${list.name} progress`} className="mt-3 w-full" />
          <p className="mt-2 caption-2 text-muted tabular-nums">
            {list.attempts > 0 ? `${formatPercent(rate(list.conversations, list.attempts))} contact rate` : "No attempts yet"}
          </p>
        </div>

        <div className="mt-auto grid gap-2">
          {left > 0 ? (
            <>
              <Link href={`/lists/${list.id}/canvass`} className={`${bigButtonClass} w-full`}>
                {list.voters_attempted === 0 ? "Start" : "Continue"}: {formatNumber(left)} {noun} left
              </Link>
              <Link href={`/lists/${list.id}`} className={`${secondaryButtonClass} min-h-11 w-full`}>
                See results
              </Link>
            </>
          ) : (
            <>
              <p className="body-5 text-ink-2">Every voter on this list has an attempt.</p>
              <Link href={`/lists/${list.id}`} className={`${bigButtonClass} w-full`}>
                See results
              </Link>
            </>
          )}
        </div>
      </div>
    </Hanger>
  );
}
