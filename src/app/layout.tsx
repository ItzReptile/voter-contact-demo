import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Doorstep · voter contact demo", template: "%s · Doorstep" },
  description:
    "A working demo of a voter contact tool: import a voter file, cut walkable turfs and call lists, assign volunteers, log every attempt. All voters are generated.",
  openGraph: {
    title: "Doorstep · voter contact demo",
    description: "Cut turf, log every door, know your contact rate. A demo with generated voters.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "The Doorstep dashboard: contact rate, attempts per day and progress by precinct" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} antialiased`}>
      <body className="font-sans">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-surface px-3 py-2 title-4 text-accent-ink ring-1 ring-line focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
