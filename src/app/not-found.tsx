import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass, Hanger, linkClass } from "@/components/ui";

export const metadata: Metadata = { title: "Not found" };

// The 404 is the thing a canvasser leaves when nobody's home.
export default function NotFound() {
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <Hanger swing className="w-64 overflow-hidden">
        <div className="bg-indigo px-6 py-8 text-left text-white">
          <h1 className="heading-3">Sorry we missed you</h1>
        </div>
        <p className="bg-orange px-6 py-2 text-left title-4 text-ink">This page isn&apos;t here</p>
        <p className="px-6 pt-6 pb-8 text-left body-6 text-ink-2">
          The link may be old, or the list was removed when the demo data reset.
        </p>
      </Hanger>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
        <Link href="/dashboard" className={buttonClass}>
          Go to the dashboard
        </Link>
        <Link href="/" className={`${linkClass} body-5`}>
          About this demo
        </Link>
      </div>
    </main>
  );
}
