import { DoorOpen, ListChecks, Phone, Plus } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/skeletons";
import { buttonClass, EmptyState, Meter, Num, PageHeader, Table } from "@/components/ui";
import { LIST_KIND_LABELS } from "@/lib/constants";
import { formatNumber, formatPercent, rate } from "@/lib/format";
import { getListSummaries } from "@/lib/lists";
import { describeSegment } from "@/lib/segments";
import { listVolunteers } from "@/lib/volunteers";
import { AssignForm } from "./assign-form";

export const metadata: Metadata = { title: "Lists" };

export default function ListsPage() {
  return (
    <>
      <PageHeader
        title="Lists"
        description="Each list is a snapshot of the voters a segment matched, in walk order for doors and alphabetical for calls."
        actions={
          <Link href="/lists/new" className={buttonClass}>
            <Plus size={16} weight="bold" aria-hidden />
            New list
          </Link>
        }
      />
      <Suspense fallback={<TableSkeleton label="Loading lists" />}>
        <ListsTable />
      </Suspense>
    </>
  );
}

async function ListsTable() {
  await connection();
  const [lists, volunteers] = await Promise.all([getListSummaries(), listVolunteers()]);

  if (lists.length === 0) {
    return (
      <EmptyState icon={<ListChecks size={24} aria-hidden />} title="No lists yet" action={{ href: "/lists/new", label: "Build a segment" }}>
        A list is who one volunteer will call or visit. Pick precincts, ages and scores, watch the count, then create it.
      </EmptyState>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <Table label="Lists">
        <thead>
          <tr>
            <th>List</th>
            <th>Progress</th>
            <th className="text-right">Conversations</th>
            <th className="text-right">Contact rate</th>
            <th>Volunteer</th>
          </tr>
        </thead>
        <tbody>
          {lists.map((list) => {
            const KindIcon = list.kind === "door" ? DoorOpen : Phone;
            return (
              <tr key={list.id}>
                <td className="min-w-64">
                  <Link href={`/lists/${list.id}`} className="flex items-center gap-2 body-5 hover:underline">
                    <KindIcon size={16} className="shrink-0 text-muted" aria-label={LIST_KIND_LABELS[list.kind]} />
                    {list.name}
                  </Link>
                  <span className="mt-1 block caption-5 text-muted">{describeSegment(list.segment)}</span>
                </td>
                <td>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Meter value={list.voters_attempted} max={list.size} label={`${list.name} progress`} className="w-20" />
                    <span className="caption-2 tabular-nums text-muted">
                      {formatNumber(list.voters_attempted)} / {formatNumber(list.size)}
                    </span>
                  </div>
                </td>
                <Num>{formatNumber(list.conversations)}</Num>
                <Num>{formatPercent(rate(list.conversations, list.attempts))}</Num>
                <td>
                  <AssignForm listId={list.id} listName={list.name} volunteerId={list.volunteer_id} volunteers={volunteers} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
