import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Card, EmptyState, linkClass, Loading, Num, PageHeader, Table } from "@/components/ui";
import { PARTY_LABELS } from "@/lib/constants";
import { formatNumber, formatPhone } from "@/lib/format";
import { countVoters, listVoters } from "@/lib/voters";
import { ImportForm } from "./import-form";

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
      <Suspense fallback={<Loading />}>
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

  return (
    <Card title={`${formatNumber(total)} voters`}>
      {total === 0 ? (
        <EmptyState>No voters yet. Import a CSV above, or run npm run seed.</EmptyState>
      ) : (
        <>
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
                  <td>
                    {voter.last_name}, {voter.first_name}
                  </td>
                  <td>{voter.address}</td>
                  <td>{voter.precinct}</td>
                  <Num>{voter.age}</Num>
                  <td>{PARTY_LABELS[voter.party]}</td>
                  <td className="whitespace-nowrap">{formatPhone(voter.phone)}</td>
                  <Num>{voter.support_score}</Num>
                </tr>
              ))}
            </tbody>
          </Table>
          <nav aria-label="Pages" className="mt-4 flex items-center gap-4 text-sm">
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
        </>
      )}
    </Card>
  );
}
