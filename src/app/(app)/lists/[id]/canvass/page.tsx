import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { CanvassSkeleton } from "@/components/skeletons";
import { BackLink, buttonClass, Hanger, Meter } from "@/components/ui";
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
  const door = list.kind === "door";

  return (
    <div className="mx-auto max-w-md">
      {/* Kept short: on a phone the hanger's support buttons should fit without scrolling. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        <div className="min-w-0 flex-1 basis-32">
          <BackLink href={`/lists/${list.id}`} title={list.name}>
            {list.name}
          </BackLink>
        </div>
        <p className="caption-2 whitespace-nowrap text-muted tabular-nums">
          <span className="heading-6 text-ink">{formatNumber(attempted)}</span> of {formatNumber(list.size)} attempted
        </p>
      </div>
      <h1 className="heading-5 break-words">
        {list.volunteer_name ? `${list.volunteer_name}'s ${door ? "doors" : "calls"}` : "Canvass"}
      </h1>
      <Meter value={attempted} max={list.size} label="List progress" className="mt-2 mb-3 w-full" />

      {list.volunteer_id === null ? (
        <HangerNote title="Assign this list first" action={{ href: `/lists/${list.id}`, label: "Assign a volunteer" }}>
          Attempts are credited to the volunteer who holds the list. Assign one, then start {door ? "knocking" : "calling"}.
        </HangerNote>
      ) : state.next ? (
        <CanvassCard
          // A skip starts a fresh card, so Undo is only offered for the save that brought up this voter.
          key={after}
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
        <HangerNote title="End of the list" action={{ href: `/lists/${list.id}/canvass`, label: "Go back to skipped voters" }}>
          {formatNumber(state.remaining)} {state.remaining === 1 ? "voter you skipped is" : "voters you skipped are"} still waiting for a first attempt.
        </HangerNote>
      ) : (
        <HangerNote
          title="Every voter on this list has an attempt"
          // Orange prints only when there is a conversation to count.
          strip={
            list.conversations > 0
              ? `${formatNumber(list.conversations)} ${list.conversations === 1 ? "conversation" : "conversations"}`
              : undefined
          }
          action={{ href: `/lists/${list.id}`, label: "See the results" }}
        >
          Not homes stay on the list. Cut a new list with Not yet reached to {door ? "knock on their doors" : "call them"} again.
        </HangerNote>
      )}
    </div>
  );
}

/** When there is no voter to show: the hanger still hangs, with what happened and the next step. */
function HangerNote({
  title,
  strip,
  action,
  children,
}: {
  title: string;
  strip?: string;
  action: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <Hanger className="mt-3 overflow-hidden">
      <div className="bg-indigo px-6 py-8 text-white">
        <h2 className="heading-4">{title}</h2>
      </div>
      {strip && <p className="bg-orange px-6 py-2 title-4 text-ink">{strip}</p>}
      <div className="grid justify-items-start gap-6 px-6 pt-6 pb-8">
        <p className="body-6 text-ink-2">{children}</p>
        <Link href={action.href} className={`${buttonClass} min-h-11`}>
          {action.label}
        </Link>
      </div>
    </Hanger>
  );
}
