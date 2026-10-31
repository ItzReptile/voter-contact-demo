"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/voters", label: "Voters" },
  { href: "/lists", label: "Lists" },
  { href: "/volunteers", label: "Volunteers" },
] as const;

/** The current URL is only known at request time, so the layout wraps this in <Suspense>. */
export function NavLinks() {
  return <LinkList pathname={usePathname()} />;
}

/** pathname null = no link highlighted (the Suspense fallback). */
export function LinkList({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main" className="flex gap-1 text-sm">
      {LINKS.map(({ href, label }) => {
        const active = pathname !== null && (href === "/" ? pathname === "/" : pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded px-3 py-1.5 ${active ? "bg-line font-medium text-ink" : "text-ink-2 hover:text-ink"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
