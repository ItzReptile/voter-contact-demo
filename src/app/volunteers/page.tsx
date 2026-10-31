import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Card, EmptyState, linkClass, Loading, Num, PageHeader, Table } from "@/components/ui";
import { formatNumber, formatPercent, rate } from "@/lib/format";
import { listVolunteers } from "@/lib/volunteers";
import { AddVolunteerForm } from "./add-volunteer-form";

export default function VolunteersPage() {
  return (
    <>
      <PageHeader
        title="Volunteers"
        description="Attempts are credited to whoever a list is assigned to when the contact is logged."
      />
      <Card title="Add a volunteer" className="mb-6">
        <AddVolunteerForm />
      </Card>
      <Suspense fallback={<Loading />}>
        <VolunteerTable />
      </Suspense>
    </>
  );
}

async function VolunteerTable() {
  await connection();
  const volunteers = await listVolunteers();

  return (
    <>
      <Card>
        {volunteers.length === 0 ? (
          <EmptyState>No volunteers yet.</EmptyState>
        ) : (
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
                  <td>
                    <Link href={`/volunteers/${volunteer.id}`} className={linkClass}>
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
        )}
      </Card>
    </>
  );
}
