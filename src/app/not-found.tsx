import { Signpost } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass, linkClass } from "@/components/ui";

export const metadata: Metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-raised text-ink-2">
        <Signpost size={32} aria-hidden />
      </div>
      <h1 className="heading-4">This page isn&apos;t on any list</h1>
      <p className="mt-3 body-3 text-ink-2">
        The link may be old, or the list may have been removed when the demo data reset.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
        <Link href="/dashboard" className={buttonClass}>
          Go to the dashboard
        </Link>
        <Link href="/" className={`${linkClass} body-5`}>
          About this demo
        </Link>
      </div>
    </div>
  );
}
