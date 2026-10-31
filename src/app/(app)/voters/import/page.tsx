import type { Metadata } from "next";
import { BackLink, PageHeader } from "@/components/ui";
import { PARTIES, REQUIRED_COLUMNS } from "@/lib/constants";
import { ImportForm } from "../import-form";

export const metadata: Metadata = { title: "Import voters" };

type Column = (typeof REQUIRED_COLUMNS)[number];

// What each column must hold, from the checks in src/lib/csv.ts. Columns without a note just can't be blank.
const COLUMN_NOTES: Partial<Record<Column, string>> = {
  voter_id: "Importing the same ID again updates that voter",
  address: "House number first, like 412 Maple Ave, so turf sorts in walk order",
  zip: "5 digits",
  age: "18 to 120",
  party: `${PARTIES.slice(0, -1).join(", ")} or ${PARTIES.at(-1)}`,
  phone: "10 digits, or blank",
  support_score: "0 to 100",
};

export default function ImportPage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <BackLink href="/voters">Voters</BackLink>
        }
        title="Import a voter file"
        description="Each row is checked on its own. Rows with a problem are skipped and listed by line number; the rest import."
      />
      {/* flex, not grid: keeps the form column from growing past the page on a phone. */}
      <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
        <div className="min-w-0 flex-1">
          <ImportForm />
        </div>

        <section aria-labelledby="columns-heading" className="min-w-0 lg:w-80 lg:shrink-0">
          <h2 id="columns-heading" className="heading-6">
            What the file needs
          </h2>
          <p className="mt-2 body-6 text-ink-2">
            A header row, then one voter per row. Columns can come in any order and any case; extra columns are ignored. Every column needs
            a value except phone.
          </p>
          <dl className="mt-4 border-t-2 border-ink">
            {REQUIRED_COLUMNS.map((column) => (
              <div key={column} className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-baseline gap-x-4 border-b border-line-soft py-2">
                <dt className="body-4 text-ink">{column}</dt>
                <dd className="caption-2 text-muted">{COLUMN_NOTES[column] ?? "Required"}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 caption-2 text-muted">
            The sample file has 2,400 generated voters. Three rows have mistakes on purpose, so you can see how problems are reported.
          </p>
        </section>
      </div>
    </>
  );
}
