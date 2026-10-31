import { Suspense } from "react";
import { AppNavigation, NavLinks } from "@/components/nav-links";

// The app: a sidebar (or a top bar on phones) and the page on a white inset panel.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen lg:flex">
      <Suspense fallback={<AppNavigation pathname={null} />}>
        <NavLinks />
      </Suspense>
      <main id="main" className="min-w-0 flex-1 lg:py-2 lg:pr-2">
        <div className="min-h-screen bg-surface lg:min-h-[calc(100vh-16px)] lg:rounded-2xl lg:border lg:border-line">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-12">{children}</div>
        </div>
      </main>
    </div>
  );
}
