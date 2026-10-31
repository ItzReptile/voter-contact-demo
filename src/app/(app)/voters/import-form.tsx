"use client";

import { CheckCircle, FileCsv, UploadSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { buttonClass, InlineError, linkClass } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { importVotersAction, type ImportState } from "./actions";

export function ImportForm() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(importVotersAction, { status: "idle" });
  const [fileName, setFileName] = useState("");

  return (
    <div className="grid gap-4">
      <form action={formAction} className="grid gap-4">
        <label className="group flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-subtle px-4 py-8 text-center transition hover:border-accent hover:bg-accent-tint has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
          <span className="flex size-12 items-center justify-center rounded-xl bg-surface text-accent ring-1 ring-line">
            <FileCsv size={24} aria-hidden />
          </span>
          <span className="title-4">{fileName || "Voter file (CSV)"}</span>
          <span className="caption-2 text-muted">{fileName ? "Choose a different file" : "Click to choose a file, up to 5 MB"}</span>
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            aria-label="Voter file (CSV)"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
            className="sr-only"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className={buttonClass}>
            <UploadSimple size={16} aria-hidden />
            {pending ? "Importing" : "Import"}
          </button>
          <a href="/sample-voters.csv" download className={`${linkClass} caption-1`}>
            Download the sample file
          </a>
        </div>
      </form>

      {state.status === "error" && <InlineError>{state.message}</InlineError>}

      {state.status === "done" && (
        <div role="status" className="rounded-xl border border-line p-4">
          <p className="flex items-start gap-2 body-5">
            <CheckCircle size={20} weight="fill" aria-hidden className="shrink-0 text-teal" />
            <span>
              Imported {formatNumber(state.inserted)} new and updated {formatNumber(state.updated)} existing voters.
              {state.errorCount > 0 && ` Skipped ${formatNumber(state.errorCount)} ${state.errorCount === 1 ? "row" : "rows"}.`}
            </span>
          </p>
          {state.errors.length > 0 && (
            <ul className="mt-3 grid gap-1 pl-8 body-6 text-muted">
              {state.errors.map((error) => (
                <li key={error.line}>
                  <span className="text-ink">Line {error.line}:</span> {error.message}
                </li>
              ))}
              {state.errorCount > state.errors.length && (
                <li>{formatNumber(state.errorCount - state.errors.length)} more not shown</li>
              )}
            </ul>
          )}
          <Link href="/voters" className={`${linkClass} mt-3 inline-block pl-8 caption-1`}>
            See the voters
          </Link>
        </div>
      )}
    </div>
  );
}
