import { AddressBook } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/skeletons";
import { Card, EmptyState, linkClass, Num, PageHeader, Table } from "@/components/ui";
import { PARTY_LABELS } from "@/lib/constants";
import { formatNumber, formatPhone } from "@/lib/format";
import { countVoters, listVoters } from "@/lib/voters";
import { ImportForm } from "./import-form";

export const metadata: Metadata = { title: "Voters" };

const PAGE_SIZE = 50;

export default function VotersPage({ searchParams }: PageProps<"/voters">) {
  return (
    <>
      <PageHeader
        title="Voters"
        description="Upload a voter file. Rows with problems are skipped and listed by line number; the rest import."
      />
      <Card title="Import" className="mb-6">
        <ImportForm />
      </Card>
      <Suspense fallback={<TableSkeleton label="Loading voters" />}>
        <VoterTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function VoterTable({ searchParams }: Pick<PageProps<"/voters">, "searchParams">) {
  await connection();
  const { page } = await searchParams;
  const pageNumber = Math.max(1, Number(page) || 1);

  const [total, voters] = await Promise.all([countVoters(), listVoters(PAGE_SIZE, (pageNumber - 1) * PAGE_SIZE)]);
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (total === 0) {
    return (
      <EmptyState icon={<AddressBook size={24} aria-hidden />} title="No voters yet">
        Import a CSV above. The sample file has 2,400 generated voters and three bad rows that show how errors are
        reported.
      </EmptyState>
    );
  }

  return (
    <Card title={`${formatNumber(total)} voters`}>
      <Table label="Voters">
        <thead>
          <tr>
            <th>Voter ID</th>
            <th>Name</th>
            <th>Address</th>
            <th>Precinct</th>
            <th className="text-right">Age</th>
            <th>Party</th>
            <th>Phone</th>
            <th className="text-right">Support score</th>
          </tr>
        </thead>
        <tbody>
          {voters.map((voter) => (
            <tr key={voter.id}>
              <td className="text-ink-2">{voter.voter_file_id}</td>
              <td className="whitespace-nowrap">
                {voter.last_name}, {voter.first_name}
              </td>
              <td className="whitespace-nowrap">{voter.address}</td>
              <td>{voter.precinct}</td>
              <Num>{voter.age}</Num>
              <td>{PARTY_LABELS[voter.party]}</td>
              <td className="whitespace-nowrap">{formatPhone(voter.phone)}</td>
              <Num>{voter.support_score}</Num>
            </tr>
          ))}
        </tbody>
      </Table>
      <nav aria-label="Pages" className="mt-4 flex items-center gap-4 body-6">
        {pageNumber > 1 && (
          <Link href={`/voters?page=${pageNumber - 1}`} className={linkClass}>
            Previous
          </Link>
        )}
        <span className="text-ink-2">
          Page {pageNumber} of {lastPage}
        </span>
        {pageNumber < lastPage && (
          <Link href={`/voters?page=${pageNumber + 1}`} className={linkClass}>
            Next
          </Link>
        )}
      </nav>
    </Card>
  );
}
