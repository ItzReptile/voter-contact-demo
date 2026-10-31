import { UsersThree } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/skeletons";
import { EmptyState, Num, PageHeader, Table } from "@/components/ui";
import { formatNumber, formatPercent, rate } from "@/lib/format";
import { listVolunteers, type VolunteerRow } from "@/lib/volunteers";
import { AddVolunteerForm } from "./add-volunteer-form";

export const metadata: Metadata = { title: "Volunteers" };

export default function VolunteersPage() {
  return (
    <>
      <PageHeader
        title="Volunteers"
        description="Each attempt counts for whoever holds the list when it is logged. Open a volunteer to see their lists."
      />
      <div className="mb-8">
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

  const most = Math.max(...volunteers.map((volunteer) => volunteer.attempts), 1);

  return (
    <section aria-label="Roster" className="min-w-0 rounded-2xl border border-line bg-paper">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 pt-4 pb-2 caption-2 text-ink-2" aria-hidden>
        <Key className="bg-orange" label="Conversations" />
        <Key className="bg-indigo" label="Other attempts" />
      </div>
      <Table label="Volunteers">
        <thead>
          <tr>
            <th>Volunteer</th>
            {/* On a phone the bar under each name shows the conversations; these two columns return at sm. */}
            <th className="hidden text-right sm:table-cell">Lists</th>
            <th className="text-right">Attempts</th>
            <th className="hidden text-right sm:table-cell">Conversations</th>
            <th className="text-right">Contact rate</th>
          </tr>
        </thead>
        <tbody>
          {volunteers.map((volunteer) => (
            <tr key={volunteer.id}>
              <td className="sm:min-w-48">
                <Link href={`/volunteers/${volunteer.id}`} className="body-4 break-words text-ink underline decoration-line underline-offset-4 transition-colors duration-150 ease-out hover:text-indigo hover:decoration-indigo">
                  {volunteer.name}
                </Link>
                <Work volunteer={volunteer} most={most} />
              </td>
              <Num className="hidden sm:table-cell">{formatNumber(volunteer.lists)}</Num>
              <Num>{formatNumber(volunteer.attempts)}</Num>
              <Num className="hidden sm:table-cell">{formatNumber(volunteer.conversations)}</Num>
              <Num className="body-4">{formatPercent(rate(volunteer.conversations, volunteer.attempts))}</Num>
            </tr>
          ))}
        </tbody>
      </Table>
    </section>
  );
}

/**
 * Everyone's attempts on one scale, printed in the two inks: orange for the attempts that
 * became a conversation, indigo for the rest. The numbers beside it say the same thing.
 */
function Work({ volunteer, most }: { volunteer: VolunteerRow; most: number }) {
  const other = volunteer.attempts - volunteer.conversations;
  if (volunteer.attempts === 0) {
    return <p className="mt-1 caption-5 text-muted">No attempts yet</p>;
  }
  return (
    <div aria-hidden className="mt-2 w-full max-w-48">
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-sm" style={{ width: `${(volunteer.attempts / most) * 100}%` }}>
        {volunteer.conversations > 0 && <span className="bg-orange" style={{ flexGrow: volunteer.conversations, flexBasis: 0 }} />}
        {other > 0 && <span className="bg-indigo" style={{ flexGrow: other, flexBasis: 0 }} />}
      </div>
    </div>
  );
}

function Key({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`size-3 rounded-sm ${className}`} />
      {label}
    </span>
  );
}
