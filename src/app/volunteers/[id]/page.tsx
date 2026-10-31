import { ListChecks } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/skeletons";
import { Card, EmptyState, linkClass, Meter, PageHeader } from "@/components/ui";
import { LIST_KIND_LABELS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { getListsForVolunteer } from "@/lib/lists";
import { getVolunteer } from "@/lib/volunteers";

// What a volunteer would see after signing in: their assigned lists and how far along each is.
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
      <Link href="/volunteers" className={`${linkClass} mb-4 inline-block body-6`}>
        All volunteers
      </Link>
      <PageHeader title={`${volunteer.name}'s lists`} />
      {lists.length === 0 ? (
        <EmptyState
          icon={<ListChecks size={24} aria-hidden />}
          title="Nothing assigned yet"
          action={{ href: "/lists", label: "Assign a list" }}
        >
          Lists assigned to {volunteer.name} show up here with how far along each one is.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {lists.map((list) => (
            <Card key={list.id}>
              <Link href={`/lists/${list.id}`} className={`${linkClass} title-3`}>
                {list.name}
              </Link>
              <p className="mt-1 caption-2 text-ink-2">{LIST_KIND_LABELS[list.kind]}</p>
              <div className="mt-4 flex items-center gap-2 caption-2">
                <Meter value={list.voters_attempted} max={list.size} label={`${list.name} progress`} />
                <span className="tabular-nums text-ink-2">
                  {formatNumber(list.voters_attempted)} of {formatNumber(list.size)} attempted ·{" "}
                  {formatNumber(list.conversations)} conversations
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
