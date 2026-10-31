import Link from "next/link";
import { Suspense } from "react";
import { AppNavigation, NavLinks } from "@/components/nav-links";

// The app: a header on the card stock, then the page.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<AppNavigation pathname={null} />}>
        <NavLinks />
      </Suspense>
      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 pt-6 pb-16 outline-none sm:px-6 sm:pt-10">
        {children}
      </main>
      <footer id="footer" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 pb-8 caption-2 text-muted sm:px-6">
        <span>Every voter here is generated. The data resets every night.</span>
        <Link href="/" className="inline-flex min-h-6 items-center transition-colors duration-150 ease-out hover:text-ink">
          About this demo
        </Link>
      </footer>
    </div>
  );
}
