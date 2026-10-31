"use client";

import { useActionState } from "react";
import { buttonClass, linkClass } from "@/components/ui";
import { REQUIRED_COLUMNS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { importVotersAction, type ImportState } from "./actions";

export function ImportForm() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(importVotersAction, { status: "idle" });

  return (
    <div>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Voter file (CSV)
          <input type="file" name="file" accept=".csv,text/csv" required className="text-sm" />
        </label>
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Importing…" : "Import"}
        </button>
      </form>
      <p className="mt-2 text-xs text-ink-2">
        Columns: <code>{REQUIRED_COLUMNS.join(", ")}</code>. Re-importing a file updates voters by{" "}
        <code>voter_id</code>.{" "}
        <a href="/sample-voters.csv" download className={linkClass}>
          Download the sample file
        </a>
      </p>

      {state.status === "error" && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {state.message}
        </p>
      )}

      {state.status === "done" && (
        <div role="status" className="mt-4 rounded border border-line p-3 text-sm">
          <p className="font-medium">
            Imported {formatNumber(state.inserted)} new and updated {formatNumber(state.updated)} existing voters.
            {state.errorCount > 0 && ` Skipped ${formatNumber(state.errorCount)} ${state.errorCount === 1 ? "row" : "rows"}.`}
          </p>
          {state.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-ink-2">
              {state.errors.map((error) => (
                <li key={error.line}>
                  Line {error.line}: {error.message}
                </li>
              ))}
              {state.errorCount > state.errors.length && (
                <li>…and {formatNumber(state.errorCount - state.errors.length)} more</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
