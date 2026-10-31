"use client";

import { buttonClass, Hanger } from "@/components/ui";

// In place of the canvass view when it fails to load, usually a dropped signal right after a tap.
// The app header stays, and Try again fetches the same voter list again. Looks like HangerNote.
export default function CanvassError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="mx-auto max-w-md">
      <Hanger className="overflow-hidden">
        <div className="bg-indigo px-6 py-8 text-white">
          <h1 className="heading-4">Your last tap may not have been saved</h1>
        </div>
        <div className="grid justify-items-start gap-6 px-6 pt-6 pb-8">
          <p className="body-6 text-ink-2">
            Check your signal and try again. If the same voter comes back, nothing was saved for them, so log them again.
          </p>
          <button type="button" onClick={() => retry()} className={`${buttonClass} min-h-11`}>
            Try again
          </button>
        </div>
      </Hanger>
    </div>
  );
}
