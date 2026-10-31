"use client";

import { AddressBook, ChartBar, ListChecks, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", Icon: ChartBar },
  { href: "/voters", label: "Voters", Icon: AddressBook },
  { href: "/lists", label: "Lists", Icon: ListChecks },
  { href: "/volunteers", label: "Volunteers", Icon: UsersThree },
] as const;

const isActive = (pathname: string | null, href: string) => pathname !== null && pathname.startsWith(href);

/** The current URL is only known at request time, so the layout wraps this in <Suspense>. */
export function NavLinks() {
  return <NavBar pathname={usePathname()} />;
}

/**
 * A compact bar floating off the top edge, sized to its content. On small screens the links
 * move into a full height menu. pathname null = nothing highlighted (the Suspense fallback).
 */
export function NavBar({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false);

  // Close the menu on Escape (links close it on click).
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <nav
        aria-label="Main"
        className="sticky top-4 z-40 mx-auto flex w-fit items-center gap-2 rounded-full border border-line bg-surface/75 p-2 backdrop-blur-md"
      >
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className="flex items-center gap-2 rounded-full px-3 py-2 title-4 transition hover:bg-raised"
        >
          <span aria-hidden className="size-3 rounded-full bg-button" />
          Voter Contact
        </Link>
        <div className="hidden items-center gap-1 sm:flex">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={`rounded-full px-3 py-2 title-4 transition ${
                isActive(pathname, href) ? "bg-raised text-ink" : "text-ink-2 hover:bg-raised hover:text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
          className="relative z-50 flex size-10 items-center justify-center rounded-full transition hover:bg-raised sm:hidden"
        >
          {/* Two lines that rotate into an X. */}
          <span
            aria-hidden
            className={`absolute h-0.5 w-4 rounded-full bg-ink transition-transform duration-500 motion-reduce:transition-none ${open ? "rotate-45" : "-translate-y-1"}`}
          />
          <span
            aria-hidden
            className={`absolute h-0.5 w-4 rounded-full bg-ink transition-transform duration-500 motion-reduce:transition-none ${open ? "-rotate-45" : "translate-y-1"}`}
          />
        </button>
      </nav>

      <div
        id="mobile-menu"
        hidden={!open}
        className="fixed inset-0 z-30 bg-page/90 px-6 pt-24 backdrop-blur-xl sm:hidden"
      >
        <ul className="grid gap-2">
          {LINKS.map(({ href, label, Icon }, index) => (
            <li
              key={href}
              // Links arrive one after another: 60ms apart, the whole sequence under 400ms.
              style={{ animationDelay: `${Math.min(index * 60, 340)}ms` }}
              className="motion-safe:animate-menu-in"
            >
              <Link
                href={href}
                onClick={() => setOpen(false)}
                aria-current={isActive(pathname, href) ? "page" : undefined}
                className={`flex items-center gap-4 rounded-2xl px-4 py-4 heading-5 transition ${
                  isActive(pathname, href) ? "bg-raised" : "hover:bg-raised"
                }`}
              >
                <Icon size={24} aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
