import { CheckCircle, Flag, UserPlus } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { CanvassSkeleton } from "@/components/skeletons";
import { EmptyState, Meter } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { getCanvassState, getListSummary } from "@/lib/lists";
import { CanvassCard } from "./canvass-card";

export const metadata: Metadata = { title: "Canvass" };

// The volunteer view: one voter at a time, in walk or call order, logged with one tap.
export default function CanvassPage(props: PageProps<"/lists/[id]/canvass">) {
  return (
    <Suspense fallback={<CanvassSkeleton />}>
      <Canvass {...props} />
    </Suspense>
  );
}

async function Canvass({ params, searchParams }: PageProps<"/lists/[id]/canvass">) {
  await connection();
  const listId = Number((await params).id);
  if (!Number.isInteger(listId) || listId <= 0) notFound();
  const after = Math.max(0, Number((await searchParams).after) || 0);

  const [list, state] = await Promise.all([getListSummary(listId), getCanvassState(listId, after)]);
  if (!list) notFound();

  const attempted = list.size - state.remaining;

  return (
    <div className="mx-auto max-w-xl">
      <Link href={`/lists/${list.id}`} className="caption-1 text-muted transition hover:text-ink">
        {list.name}
      </Link>
      <div className="mt-2 mb-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="heading-6">{list.volunteer_name ? `${list.volunteer_name}'s ${list.kind === "door" ? "doors" : "calls"}` : "Canvass"}</h1>
          <p className="caption-2 whitespace-nowrap text-muted tabular-nums">
            {formatNumber(attempted)} of {formatNumber(list.size)} attempted
          </p>
        </div>
        <Meter value={attempted} max={list.size} label="List progress" className="mt-3 w-full" />
      </div>

      {list.volunteer_id === null ? (
        <EmptyState icon={<UserPlus size={24} aria-hidden />} title="Assign this list first" action={{ href: `/lists/${list.id}`, label: "Assign a volunteer" }}>
          Every attempt is credited to the volunteer the list is assigned to.
        </EmptyState>
      ) : state.next ? (
        <CanvassCard
          listId={list.id}
          kind={list.kind}
          size={list.size}
          voter={{
            id: state.next.id,
            name: `${state.next.first_name} ${state.next.last_name}`,
            position: state.next.position,
            address: state.next.address,
            precinct: state.next.precinct,
            phone: state.next.phone,
            age: state.next.age,
            party: state.next.party,
            score: state.next.support_score,
          }}
        />
      ) : state.remaining > 0 ? (
        <EmptyState icon={<Flag size={24} aria-hidden />} title="End of the list" action={{ href: `/lists/${list.id}/canvass`, label: "Go back to skipped voters" }}>
          {formatNumber(state.remaining)} {state.remaining === 1 ? "voter you skipped is" : "voters you skipped are"} still waiting for a first attempt.
        </EmptyState>
      ) : (
        <EmptyState icon={<CheckCircle size={24} aria-hidden />} title="Every voter on this list has an attempt" action={{ href: `/lists/${list.id}`, label: "See the results" }}>
          Not homes stay on the list. Cut a new list with Not yet reached to knock them again.
        </EmptyState>
      )}
    </div>
  );
}
