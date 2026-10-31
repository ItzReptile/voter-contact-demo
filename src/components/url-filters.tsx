"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useTransition, type ReactNode } from "react";

// Filters live in the URL. Changing one replaces the URL inside a transition, so the server
// renders the new results while the old ones stay on screen, dimmed.

type FilterNavigation = { pending: boolean; navigate: (href: string) => void };

const Context = createContext<FilterNavigation>({ pending: false, navigate: () => {} });

export function UrlFilters({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = (href: string) => startTransition(() => router.replace(href, { scroll: false }));
  return <Context.Provider value={{ pending, navigate }}>{children}</Context.Provider>;
}

export function useFilterNavigation(): FilterNavigation {
  return useContext(Context);
}

/** Wraps results so they dim while new ones load. */
export function PendingRegion({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { pending } = useFilterNavigation();
  return (
    <div aria-busy={pending} className={`transition-opacity duration-300 ${pending ? "opacity-50" : ""} ${className}`}>
      {children}
    </div>
  );
}
