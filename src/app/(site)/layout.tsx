import Link from "next/link";
import { Logo, LogoMark } from "@/components/logo";
import { buttonClass } from "@/components/ui";

const REPO = "https://github.com/ItzReptile/voter-contact-demo";

const footerLink = "inline-flex min-h-6 items-center rounded-sm transition-colors duration-200 ease-out hover:text-ink";

// The intro and privacy pages: a plain header row on the card stock, the page, a footer.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-6 sm:px-8">
        <Link href="/" aria-label="Doorstep, about this demo" className="rounded-md transition-opacity duration-200 ease-out hover:opacity-75">
          <Logo />
        </Link>
        <Link href="/dashboard" className={buttonClass}>
          Open the demo
        </Link>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-6 px-4 pt-12 pb-16 caption-2 text-muted sm:px-8">
        <p className="flex items-center gap-2">
          <LogoMark className="h-5 w-4 shrink-0" />
          A demo by Jose Hernandez. Every voter is generated.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/privacy" className={footerLink}>
            Privacy
          </Link>
          <a href={REPO} className={footerLink}>
            Source on GitHub
          </a>
          <a href="https://nikkosets.com" className={footerLink}>
            nikkosets.com
          </a>
        </nav>
      </footer>
    </>
  );
}
