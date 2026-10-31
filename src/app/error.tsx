"use client";

import { buttonClass } from "@/components/ui";

// Shown when a page or Server Action throws something that isn't a UserError (a bug or an outage).
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-6">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="mt-1 text-sm text-ink-2">The error was logged on the server. Try again, or reload the page.</p>
      <button type="button" onClick={reset} className={`${buttonClass} mt-4`}>
        Try again
      </button>
    </div>
  );
}
