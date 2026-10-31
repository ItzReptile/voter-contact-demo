"use client";

import { Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "./logo";
import { buttonClass } from "./ui";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/voters", label: "Voters" },
  { href: "/lists", label: "Lists" },
  { href: "/volunteers", label: "Volunteers" },
] as const;

const isActive = (pathname: string | null, href: string) =>
  pathname !== null && (pathname === href || pathname.startsWith(`${href}/`));

/** The current URL is only known at request time, so the app layout wraps this in <Suspense>. */
export function NavLinks() {
  return <AppNavigation pathname={usePathname()} />;
}

/**
 * The header printed across the top of the card stock: wordmark, four text links (the current
 * one inked in indigo), New list. On phones the links move into a full height menu.
 * pathname null = nothing highlighted (the Suspense fallback).
 */
export function AppNavigation({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  // While the menu is open: Escape closes it and puts focus back on the toggle, and the page
  // behind it neither scrolls nor takes focus (inert), so Tab stays in the header and the menu.
  useEffect(() => {
    if (!open) return;
    const behind = document.querySelectorAll("#main, #footer");
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    behind.forEach((element) => element.setAttribute("inert", ""));
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      behind.forEach((element) => element.removeAttribute("inert"));
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-stock/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 rounded-md">
            <LogoMark className="h-7 w-5" />
            <span className="heading-6">Doorstep</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {LINKS.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-3 py-2 title-4 transition duration-150 ease-out ${
                    active ? "bg-soft text-indigo-deep" : "text-ink-2 hover:bg-paper hover:text-ink"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/lists/new" className={`${buttonClass} max-md:hidden`}>
              <Plus size={14} weight="bold" aria-hidden />
              New list
            </Link>
            <button
              ref={toggle}
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen(!open)}
              className="relative z-50 flex size-10 items-center justify-center rounded-md transition duration-150 ease-out hover:bg-paper md:hidden"
            >
              {/* Two lines that rotate into an X. */}
              <span
                aria-hidden
                className={`absolute h-0.5 w-4 rounded-full bg-ink transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? "rotate-45" : "-translate-y-1"}`}
              />
              <span
                aria-hidden
                className={`absolute h-0.5 w-4 rounded-full bg-ink transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? "-rotate-45" : "translate-y-1"}`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Outside the header on purpose: the header's backdrop blur would make it the box that a
          fixed child is sized against, and the menu would be 64px tall instead of full height. */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="fixed inset-0 z-30 bg-stock px-4 pt-20 motion-safe:animate-fade-in md:hidden"
      >
        <nav aria-label="Mobile">
          <ul className="grid gap-2">
            {LINKS.map(({ href, label }, index) => (
              <li
                key={href}
                // Links arrive one after another: 30ms apart.
                style={{ animationDelay: `${index * 30}ms` }}
                className="motion-safe:animate-menu-in"
              >
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, href) ? "page" : undefined}
                  className={`flex items-center rounded-xl px-4 py-4 heading-4 ${isActive(pathname, href) ? "bg-soft text-indigo-deep" : "text-ink"}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/lists/new"
            onClick={() => setOpen(false)}
            className={`${buttonClass} mt-6 w-full motion-safe:animate-menu-in`}
            style={{ animationDelay: "120ms" }}
          >
            <Plus size={14} weight="bold" aria-hidden />
            New list
          </Link>
        </nav>
      </div>
    </>
  );
}
