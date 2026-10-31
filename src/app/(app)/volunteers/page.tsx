import { UsersThree } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/skeletons";
import { EmptyState, Num, PageHeader, Table } from "@/components/ui";
import { formatNumber, formatPercent, rate } from "@/lib/format";
import { listVolunteers } from "@/lib/volunteers";
import { AddVolunteerForm } from "./add-volunteer-form";

export const metadata: Metadata = { title: "Volunteers" };

export default function VolunteersPage() {
  return (
    <>
      <PageHeader
        title="Volunteers"
        description="Attempts are credited to whoever a list is assigned to when the contact is logged. Open a volunteer to see their lists."
      />
      <div className="mb-6 rounded-xl border border-line bg-subtle p-4">
        <AddVolunteerForm />
      </div>
      <Suspense fallback={<TableSkeleton rows={5} label="Loading volunteers" />}>
        <VolunteerTable />
      </Suspense>
    </>
  );
}

async function VolunteerTable() {
  await connection();
  const volunteers = await listVolunteers();

  if (volunteers.length === 0) {
    return (
      <EmptyState icon={<UsersThree size={24} aria-hidden />} title="No volunteers yet">
        Add someone above, then assign them a list. Every contact they log is credited to them.
      </EmptyState>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <Table label="Volunteers">
        <thead>
          <tr>
            <th>Name</th>
            <th className="text-right">Lists</th>
            <th className="text-right">Attempts</th>
            <th className="text-right">Conversations</th>
            <th className="text-right">Contact rate</th>
          </tr>
        </thead>
        <tbody>
          {volunteers.map((volunteer) => (
            <tr key={volunteer.id}>
              <td className="whitespace-nowrap">
                <Link href={`/volunteers/${volunteer.id}`} className="flex items-center gap-3 body-5 hover:underline">
                  <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-accent-tint caption-3 text-accent-ink">
                    {volunteer.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  {volunteer.name}
                </Link>
              </td>
              <Num>{formatNumber(volunteer.lists)}</Num>
              <Num>{formatNumber(volunteer.attempts)}</Num>
              <Num>{formatNumber(volunteer.conversations)}</Num>
              <Num>{formatPercent(rate(volunteer.conversations, volunteer.attempts))}</Num>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
