import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { LogoMark } from "@/components/logo";

const REPO = "https://github.com/ItzReptile/voter-contact-demo";

// The intro and privacy pages: a floating pill nav, the page, a footer.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <div className="sticky top-4 z-40 px-4">
        <nav
          aria-label="Main"
          className="mx-auto flex w-fit max-w-full items-center gap-1 rounded-full border border-line bg-surface/80 p-1 pl-3 shadow-sm backdrop-blur-md sm:gap-2"
        >
          <Link href="/" className="mr-2 flex items-center gap-2 rounded-full py-1 title-4 tracking-tight">
            <LogoMark className="size-6" />
            Doorstep
          </Link>
          <div className="hidden items-center sm:flex">
            <Link href="/#how-it-works" className="rounded-full px-3 py-2 caption-1 text-muted transition hover:bg-hover hover:text-ink">
              How it works
            </Link>
            <Link href="/#questions" className="rounded-full px-3 py-2 caption-1 text-muted transition hover:bg-hover hover:text-ink">
              Questions
            </Link>
            <a href={REPO} className="rounded-full px-3 py-2 caption-1 text-muted transition hover:bg-hover hover:text-ink">
              Source
            </a>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-2 button-sm text-white transition hover:bg-accent-hover motion-safe:active:scale-98"
          >
            Open the demo
            <ArrowRight size={14} weight="bold" aria-hidden />
          </Link>
        </nav>
      </div>

      <main id="main">{children}</main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-12 caption-2 text-muted sm:px-8">
        <p className="flex items-center gap-2">
          <LogoMark className="size-5" />
          A demo by Jose Hernandez. Every voter is generated.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-6">
          <Link href="/privacy" className="transition hover:text-ink">
            Privacy
          </Link>
          <a href={REPO} className="transition hover:text-ink">
            Source on GitHub
          </a>
          <a href="https://nikkosets.com" className="transition hover:text-ink">
            nikkosets.com
          </a>
        </nav>
      </footer>
    </>
  );
}
