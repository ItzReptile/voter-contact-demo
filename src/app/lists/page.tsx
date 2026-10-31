import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { buttonClass, Card, EmptyState, linkClass, Loading, Meter, Num, PageHeader, Table } from "@/components/ui";
import { LIST_KIND_LABELS } from "@/lib/constants";
import { formatNumber, formatPercent, rate } from "@/lib/format";
import { getListSummaries } from "@/lib/lists";
import { listVolunteers } from "@/lib/volunteers";
import { AssignForm } from "./assign-form";

export default function ListsPage() {
  return (
    <>
      <PageHeader
        title="Lists"
        description="Each list is a snapshot of the voters a segment matched when it was created, in walk order for doors and alphabetical for calls."
        action={
          <Link href="/lists/new" className={buttonClass}>
            New list
          </Link>
        }
      />
      <Suspense fallback={<Loading />}>
        <ListsTable />
      </Suspense>
    </>
  );
}

async function ListsTable() {
  await connection();
  const [lists, volunteers] = await Promise.all([getListSummaries(), listVolunteers()]);

  return (
    <>
      <Card>
        {lists.length === 0 ? (
          <EmptyState>No lists yet. Build a segment to create one.</EmptyState>
        ) : (
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
                  <td>
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
                    <AssignForm
                      listId={list.id}
                      listName={list.name}
                      volunteerId={list.volunteer_id}
                      volunteers={volunteers}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
