import { DoorOpen, ListChecks, Phone, PersonSimpleWalk } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/skeletons";
import { buttonClass, EmptyState, Meter, PageHeader, secondaryButtonClass } from "@/components/ui";
import { LIST_KIND_LABELS } from "@/lib/constants";
import { formatNumber, formatPercent, rate } from "@/lib/format";
import { getListsForVolunteer } from "@/lib/lists";
import { getVolunteer } from "@/lib/volunteers";

export const metadata: Metadata = { title: "My lists" };

// What a volunteer would see after signing in: their lists, how far along each is,
// and one button to pick up where they left off.
export default function VolunteerPage({ params }: PageProps<"/volunteers/[id]">) {
  return (
    <Suspense fallback={<TableSkeleton rows={4} label="Loading the volunteer" />}>
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
          <Link href="/volunteers" className="caption-1 text-muted transition hover:text-ink">
            Volunteers
          </Link>
        }
        title={`${volunteer.name}'s lists`}
        description="Pick a list to continue where you left off. Each tap logs one door or call."
      />
      {lists.length === 0 ? (
        <EmptyState icon={<ListChecks size={24} aria-hidden />} title="Nothing assigned yet" action={{ href: "/lists", label: "Assign a list" }}>
          Lists assigned to {volunteer.name} show up here with how far along each one is.
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {lists.map((list) => {
            const KindIcon = list.kind === "door" ? DoorOpen : Phone;
            const left = list.size - list.voters_attempted;
            return (
              <article key={list.id} className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-tint text-accent">
                    <KindIcon size={20} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="title-3">{list.name}</h2>
                    <p className="caption-2 text-muted">{LIST_KIND_LABELS[list.kind]}</p>
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between caption-2 text-muted tabular-nums">
                    <span>
                      {formatNumber(list.voters_attempted)} of {formatNumber(list.size)} attempted
                    </span>
                    <span>{formatPercent(rate(list.conversations, list.attempts))} contact rate</span>
                  </div>
                  <Meter value={list.voters_attempted} max={list.size} label={`${list.name} progress`} className="w-full" />
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  {left > 0 ? (
                    <Link href={`/lists/${list.id}/canvass`} className={buttonClass}>
                      <PersonSimpleWalk size={16} aria-hidden />
                      {list.voters_attempted === 0 ? "Start" : "Continue"}: {formatNumber(left)} left
                    </Link>
                  ) : null}
                  <Link href={`/lists/${list.id}`} className={secondaryButtonClass}>
                    See results
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
