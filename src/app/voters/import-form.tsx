"use client";

import { CheckCircle, UploadSimple, Warning } from "@phosphor-icons/react";
import { useActionState } from "react";
import { buttonClass, inputClass, linkClass } from "@/components/ui";
import { REQUIRED_COLUMNS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { importVotersAction, type ImportState } from "./actions";

export function ImportForm() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(importVotersAction, { status: "idle" });

  return (
    <div>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <label className="flex w-full min-w-0 flex-col gap-2 title-4 sm:w-auto">
          Voter file (CSV)
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className={`${inputClass} w-full file:mr-3 file:rounded-md file:border-0 file:bg-raised file:px-3 file:py-1 file:caption-3 file:text-ink`}
          />
        </label>
        <button type="submit" disabled={pending} className={buttonClass}>
          <UploadSimple size={20} aria-hidden />
          {pending ? "Importing" : "Import"}
        </button>
      </form>
      <p className="mt-3 caption-2 text-ink-2">
        Columns: <span className="break-words">{REQUIRED_COLUMNS.join(", ")}</span>. Importing the same file again
        updates voters by voter_id.{" "}
        <a href="/sample-voters.csv" download className={linkClass}>
          Download the sample file
        </a>
      </p>

      {state.status === "error" && (
        <p role="alert" className="mt-4 flex items-center gap-2 body-5 text-danger">
          <Warning size={20} aria-hidden />
          {state.message}
        </p>
      )}

      {state.status === "done" && (
        <div role="status" className="mt-4 rounded-xl border border-line p-4">
          <p className="flex items-center gap-2 body-5">
            <CheckCircle size={20} aria-hidden className="shrink-0 text-success" />
            <span>
              Imported {formatNumber(state.inserted)} new and updated {formatNumber(state.updated)} existing voters.
              {state.errorCount > 0 &&
                ` Skipped ${formatNumber(state.errorCount)} ${state.errorCount === 1 ? "row" : "rows"}.`}
            </span>
          </p>
          {state.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-8 body-6 text-ink-2">
              {state.errors.map((error) => (
                <li key={error.line}>
                  Line {error.line}: {error.message}
                </li>
              ))}
              {state.errorCount > state.errors.length && (
                <li>{formatNumber(state.errorCount - state.errors.length)} more not shown</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
