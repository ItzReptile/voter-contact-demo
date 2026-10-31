import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { REQUIRED_COLUMNS } from "@/lib/constants";
import { ImportForm } from "../import-form";

export const metadata: Metadata = { title: "Import voters" };

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={
          <Link href="/voters" className="caption-1 text-muted transition hover:text-ink">
            Voters
          </Link>
        }
        title="Import a voter file"
        description="Each row is checked on its own. Rows with problems are skipped and listed by line number; the rest import. Importing the same file again updates voters by voter_id."
      />
      <Card>
        <ImportForm />
      </Card>
      <div className="mt-6 rounded-xl border border-line bg-subtle p-4">
        <h2 className="title-4">Columns</h2>
        <p className="mt-1 caption-2 text-muted">Any order, case insensitive. Phone may be blank.</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {REQUIRED_COLUMNS.map((column) => (
            <li key={column} className="rounded-md border border-line bg-surface px-2 py-0.5 caption-4 text-ink-2">
              {column}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
