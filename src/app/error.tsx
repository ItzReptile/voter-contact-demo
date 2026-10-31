"use client";

import { buttonClass } from "@/components/ui";

// Shown when a page or Server Action throws something that isn't a UserError (a bug or an outage).
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="heading-2">This page didn&apos;t load</h1>
      <p className="mt-3 max-w-md body-3 text-ink-2">
        The server hit an error and logged it. Try again; if it keeps failing, the database may be unreachable.
      </p>
      <button type="button" onClick={() => retry()} className={`${buttonClass} mt-8`}>
        Try again
      </button>
    </main>
  );
}
