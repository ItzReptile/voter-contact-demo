import { ListChecks, Plus } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/skeletons";
import { buttonClass, Card, EmptyState, linkClass, Meter, Num, PageHeader, Table } from "@/components/ui";
import { LIST_KIND_LABELS } from "@/lib/constants";
import { formatNumber, formatPercent, rate } from "@/lib/format";
import { getListSummaries } from "@/lib/lists";
import { listVolunteers } from "@/lib/volunteers";
import { AssignForm } from "./assign-form";

export const metadata: Metadata = { title: "Lists" };

export default function ListsPage() {
  return (
    <>
      <PageHeader
        title="Lists"
        description="Each list is a snapshot of the voters a segment matched when it was created, in walk order for doors and alphabetical for calls."
        action={
          <Link href="/lists/new" className={buttonClass}>
            <Plus size={20} aria-hidden />
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
      <EmptyState
        icon={<ListChecks size={24} aria-hidden />}
        title="No lists yet"
        action={{ href: "/lists/new", label: "Build a segment" }}
      >
        A list is who one volunteer will call or visit. Pick precincts, ages and scores, preview who matches, then
        create it.
      </EmptyState>
    );
  }

  return (
    <Card>
      <Table label="Lists">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th className="text-right">Voters</th>
            <th>Attempted</th>
            <th className="text-right">Conversations</th>
            <th className="text-right">Contact rate</th>
            <th>Volunteer</th>
          </tr>
        </thead>
        <tbody>
          {lists.map((list) => (
            <tr key={list.id}>
              <td className="min-w-48">
                <Link href={`/lists/${list.id}`} className={linkClass}>
                  {list.name}
                </Link>
              </td>
              <td className="whitespace-nowrap">{LIST_KIND_LABELS[list.kind]}</td>
              <Num>{formatNumber(list.size)}</Num>
              <td>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Meter value={list.voters_attempted} max={list.size} label={`${list.name} progress`} />
                  <span className="tabular-nums text-ink-2">
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
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
