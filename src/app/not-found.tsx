import { Signpost } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { buttonClass, linkClass } from "@/components/ui";

export const metadata: Metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <LogoMark className="mb-12 size-8" />
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-accent-tint text-accent">
        <Signpost size={32} aria-hidden />
      </div>
      <h1 className="heading-4">This page isn&apos;t on any list</h1>
      <p className="mt-3 max-w-md body-3 text-muted">
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
    </main>
  );
}
