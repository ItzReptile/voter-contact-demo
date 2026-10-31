"use client";

import { Warning } from "@phosphor-icons/react";
import { buttonClass } from "@/components/ui";

// Shown when a page or Server Action throws something that isn't a UserError (a bug or an outage).
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-danger-tint text-danger">
        <Warning size={32} aria-hidden />
      </div>
      <h1 className="heading-4">This page didn&apos;t load</h1>
      <p className="mt-3 max-w-md body-3 text-muted">
        The server hit an error and logged it. Try again; if it keeps failing, the database may be unreachable.
      </p>
      <button type="button" onClick={reset} className={`${buttonClass} mt-8`}>
        Try again
      </button>
    </main>
  );
}
