"use client";

import { FileCsv, UploadSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { buttonClass, InlineError, linkClass, secondaryButtonClass } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { importVotersAction, type ImportState } from "./actions";

export function ImportForm() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(importVotersAction, { status: "idle" });
  const [fileName, setFileName] = useState("");
  const [reportFor, setReportFor] = useState("");
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // React empties the file input after each import, so the chosen name goes with it
  // (and becomes the name on the report).
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    setReportFor(fileName);
    setFileName("");
  }

  const choose = (files: FileList | null | undefined) => setFileName(files?.[0]?.name ?? "");

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-4">
        {/* A perforated drop area: click to choose, or drop a file onto it. The perforation goes solid once a file is in. */}
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            // Moving between the label's own children fires dragleave too; only leaving the label counts.
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const files = event.dataTransfer.files;
            if (files.length > 0 && input.current) {
              input.current.files = files;
              choose(files);
            }
          }}
          className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed px-4 py-8 transition-colors duration-150 ease-out has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo sm:px-6 ${
            dragging
              ? "border-indigo bg-soft"
              : fileName
                ? "border-solid border-indigo bg-paper"
                : "border-line bg-paper hover:border-indigo"
          }`}
        >
          <span
            className={`flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-150 ease-out ${
              fileName ? "bg-indigo text-white" : "bg-soft text-indigo"
            }`}
          >
            <FileCsv size={24} aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="heading-6 wrap-anywhere">{fileName || "Voter file (CSV)"}</span>
            <span className="caption-2 text-muted">
              {fileName ? "Ready to import. Click to choose a different file." : "Click to choose a file, or drop one here. Up to 5 MB."}
            </span>
          </span>
          <input
            ref={input}
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            aria-label="Voter file (CSV)"
            onChange={(event) => choose(event.target.files)}
            className="sr-only"
          />
        </label>
        <div className="flex flex-wrap items-center gap-4">
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
        <div role="status" className="border-t-2 border-ink pt-6">
          {reportFor && <p className="mb-2 caption-2 text-muted wrap-anywhere">{reportFor}</p>}
          <p className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span aria-hidden className="figure text-6xl text-indigo">
              {formatNumber(state.inserted + state.updated)}
            </span>
            <span className="max-w-md body-2 text-ink">
              Imported {formatNumber(state.inserted)} new and updated {formatNumber(state.updated)} existing voters.
              {state.errorCount > 0 && ` Skipped ${formatNumber(state.errorCount)} ${state.errorCount === 1 ? "row" : "rows"}.`}
            </span>
          </p>

          {state.errors.length > 0 && (
            <div className="mt-6 border-t border-line-soft pt-4">
              <h2 className="title-4">{state.errorCount === 1 ? "Row to fix" : "Rows to fix"}</h2>
              <p className="mt-1 caption-2 text-muted">
                Correct {state.errorCount === 1 ? "it" : "them"} in the file and import it again. Voters already imported are updated, not
                added twice.
              </p>
              <ul className="mt-3 flex flex-col gap-1 body-6 text-ink-2">
                {state.errors.map((error) => (
                  <li key={error.line} className="wrap-anywhere">
                    <span className="body-4 text-ink tabular-nums">Line {error.line}:</span> {error.message}
                  </li>
                ))}
                {state.errorCount > state.errors.length && (
                  <li className="text-muted">{formatNumber(state.errorCount - state.errors.length)} more not shown</li>
                )}
              </ul>
            </div>
          )}

          <Link href="/voters" className={`${secondaryButtonClass} mt-6`}>
            See the voters
          </Link>
        </div>
      )}
    </div>
  );
}
