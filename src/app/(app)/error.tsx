"use client";

import { buttonClass } from "@/components/ui";

// Shown inside the app shell when a page throws something that isn't a UserError (a bug or an
// outage), so the header stays and there is still a way to somewhere else.
export default function AppError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex flex-col items-start py-8">
      <h1 className="heading-3">This page didn&apos;t load</h1>
      <p className="mt-3 max-w-md body-3 text-ink-2">
        The server hit an error and logged it. Try again; if it keeps failing, the database may be unreachable.
      </p>
      <button type="button" onClick={() => retry()} className={`${buttonClass} mt-6`}>
        Try again
      </button>
    </div>
  );
}
