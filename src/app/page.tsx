import {
  ArrowRight,
  ChartBar,
  Database,
  FileCsv,
  ListChecks,
  Path,
  ShieldCheck,
  UploadSimple,
  UsersThree,
  ChatCircleText,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { getImageProps } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal, TaglineReveal } from "@/components/reveal";
import { buttonClass, linkClass } from "@/components/ui";

// The intro page. One audience (people hiring for voter contact tools), one action: open the demo.
// Layout A, classic hero plus sections: the product reads from a dashboard screenshot.
// No testimonials or invented stats; every fact here is true of the demo itself.

export const metadata: Metadata = {
  title: { absolute: "Voter Contact Demo: cut turf, log every door, know your contact rate" },
};

const REPO = "https://github.com/ItzReptile/voter-contact-demo";

const BENEFITS = [
  {
    Icon: FileCsv,
    title: "Imports that explain themselves",
    text: "A bad row is skipped and named by line, like “Line 6: age must be at least 18”. The rest of the file still loads.",
  },
  {
    Icon: Path,
    title: "Turf in walk order",
    text: "Door lists sort by street, then house number. Phone lists leave out voters without a number.",
  },
  {
    Icon: ListChecks,
    title: "Lists that hold still",
    text: "A list is a snapshot, so a new import never reshuffles the doors a volunteer is already walking.",
  },
  {
    Icon: ChartBar,
    title: "Numbers you can trace",
    text: "Contact rate is conversations divided by attempts, by precinct and by list, counted from the rows volunteers saved.",
  },
];

const STEPS = [
  {
    Icon: UploadSimple,
    title: "Import the voter file",
    text: "Upload a CSV with precinct, age, party, phone and a support score. Fix the rows it flags, or leave them out.",
  },
  {
    Icon: UsersThree,
    title: "Cut a list and assign it",
    text: "Filter by precinct, age, score and contact history, preview who matches, then hand the list to a volunteer.",
  },
  {
    Icon: ChatCircleText,
    title: "Log contacts, read the results",
    text: "Record reached, not home or wrong number with a 1 to 5 support ID. The dashboard counts every attempt.",
  },
];

const FAQ = [
  {
    q: "Is any of this real voter data?",
    a: "No. Every name, address and phone number comes from a script using Faker. Phone numbers use area code 555, which isn't in service.",
  },
  {
    q: "Do I need an account?",
    a: "No. Open the demo and click around. There is no sign in, so whatever you change is visible to the next visitor.",
  },
  {
    q: "Can I break it?",
    a: "Edit anything you like. The data resets to the starting set every night.",
  },
  {
    q: "What can I try in five minutes?",
    a: "Upload the sample file on the Voters page to see the import report, build a segment for one precinct, assign it to a volunteer, log a few doors and watch the dashboard change.",
  },
  {
    q: "What is it built with?",
    a: "Next.js 16 and React 19 in TypeScript, Postgres with plain SQL, Tailwind, Vitest and Playwright. It runs on Vercel with a Neon database.",
  },
  {
    q: "How was it built?",
    a: "With Claude Code, from a written plan and a context file that sets the rules: parameterized SQL, validation at every boundary, a test for every behavior, fake data only. Both files are in the repository.",
  },
  {
    q: "What would a real campaign need that this lacks?",
    a: "Sign in with per campaign data isolation, turf cutting on a map, background imports for files with millions of rows, and an audit log.",
  },
  {
    q: "Who made it?",
    a: "I'm Jose Hernandez, a full stack engineer. I built this to show how I'd work on voter contact tools like Matchbook.",
  },
];

export default function IntroPage() {
  return (
    <div className="grid gap-24">
      <Hero />

      <Reveal className="mx-auto grid max-w-3xl gap-4 text-center">
        <h2 className="heading-4 sm:heading-3">A canvass runs on lists</h2>
        <p className="body-3 text-ink-2">
          Volunteers need a short list in an order they can walk. Organizers need to know what happened at each door
          before the next shift. Here the voter file, every list cut from it and every logged attempt live in one
          Postgres database, so the dashboard counts the same rows volunteers saved.
        </p>
      </Reveal>

      <Reveal>
        <h2 className="sr-only">What it does</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {BENEFITS.map(({ Icon, title, text }) => (
            <li key={title} className="rounded-2xl border border-line bg-surface p-6">
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-raised">
                <Icon size={20} aria-hidden />
              </div>
              <h3 className="title-2">{title}</h3>
              <p className="mt-2 body-6 text-ink-2">{text}</p>
            </li>
          ))}
        </ul>
      </Reveal>

      <section aria-label="Tagline" className="mx-auto w-full max-w-[680px] py-16">
        <TaglineReveal
          className="heading-4 sm:heading-3"
          lines={["Every knock is logged once.", "Every number on the dashboard", "traces back to a door."]}
        />
      </section>

      <Reveal>
        <h2 className="mb-8 text-center heading-4 sm:heading-3">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ Icon, title, text }, index) => (
            <li key={title} className="rounded-2xl border border-line bg-surface p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-button caption-3 text-button-ink">
                  {index + 1}
                </span>
                <Icon size={20} aria-hidden className="text-ink-2" />
              </div>
              <h3 className="title-2">{title}</h3>
              <p className="mt-2 body-6 text-ink-2">{text}</p>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal className="rounded-2xl border border-line bg-surface p-6 sm:p-12">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="heading-5 sm:heading-4">Under the hood</h2>
            <p className="mt-3 body-3 text-ink-2">
              The parts a reviewer would check first, all in the repository.
            </p>
            <a href={REPO} className={`${linkClass} mt-6 inline-flex items-center gap-2 body-2`}>
              Read the code on GitHub
              <ArrowRight size={16} aria-hidden />
            </a>
          </div>
          <ul className="grid gap-4 body-6">
            <Fact title="Plain SQL on Postgres">Every value is a parameter, including the filters that build a segment.</Fact>
            <Fact title="Rules in the database">
              A support ID needs a conversation, and a contact needs a voter who is on that list. Constraints enforce both.
            </Fact>
            <Fact title="Tests on every push">Unit, database and browser tests run in GitHub Actions against a real Postgres.</Fact>
            <Fact title="Agent context in the repo">
              A written plan, a CLAUDE.md with the rules, and a skill for the most common change.
            </Fact>
          </ul>
        </div>
      </Reveal>

      <Reveal className="mx-auto w-full max-w-3xl">
        <h2 className="mb-8 text-center heading-4 sm:heading-3">Questions</h2>
        <div className="grid gap-2">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group rounded-2xl border border-line bg-surface px-6 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 title-3">
                {q}
                <span
                  aria-hidden
                  className="text-ink-2 transition-transform duration-500 group-open:rotate-45 motion-reduce:transition-none"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 body-6 text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </Reveal>

      <Reveal className="flex flex-col items-center text-center">
        <h2 className="heading-4 sm:heading-3">See it with the demo data loaded</h2>
        <p className="mt-3 max-w-xl body-3 text-ink-2">No sign in, nothing to install, and the data resets every night.</p>
        <Link href="/dashboard" className={`${buttonClass} mt-8`}>
          Open the demo
          <ArrowRight size={20} aria-hidden />
        </Link>
      </Reveal>
    </div>
  );
}

function Hero() {
  const common = { alt: "The demo dashboard: contact rate, outcomes, support IDs and progress by precinct", width: 1280, height: 880 };
  const { props: dark } = getImageProps({ ...common, src: "/screenshots/dashboard-dark.png", priority: true });
  const { props: light } = getImageProps({ ...common, src: "/screenshots/dashboard-light.png", priority: true });

  return (
    <section className="flex flex-col items-center text-center">
      <h1 className="max-w-[680px] hero-gradient heading-3 sm:heading-1">
        Cut turf, log every door,
        <br className="hidden sm:inline" /> know your contact rate
      </h1>
      <p className="mt-6 max-w-[680px] body-3 text-ink-2">
        A working demo of a voter contact tool for campaign field teams. Import a voter file, build call lists and door
        turfs, assign them to volunteers, and track every attempt by precinct and by list.
      </p>
      <Link href="/dashboard" className={`${buttonClass} mt-8`}>
        Open the demo
        <ArrowRight size={20} aria-hidden />
      </Link>
      <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 caption-1 text-ink-2">
        <li className="flex items-center gap-2">
          <ShieldCheck size={16} aria-hidden /> No sign in
        </li>
        <li className="flex items-center gap-2">
          <Database size={16} aria-hidden /> 2,397 generated voters already loaded
        </li>
        <li className="flex items-center gap-2">
          <ListChecks size={16} aria-hidden /> Resets every night
        </li>
      </ul>
      {/* A 16px frame with 8px padding, so the screenshot gets 16 − 8 = 8px corners. */}
      <div className="mt-16 w-full rounded-2xl border border-line bg-surface p-2">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcSet={dark.srcSet} />
          <source media="(prefers-color-scheme: light)" srcSet={light.srcSet} />
          {/* <picture> picks the light or dark screenshot; getImageProps keeps next/image's resizing. */}
          <img {...light} alt={common.alt} className="h-auto w-full rounded-lg" />
        </picture>
      </div>
    </section>
  );
}

function Fact({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="rounded-xl bg-raised p-4">
      <p className="body-5 text-ink">{title}</p>
      <p className="mt-1 text-ink-2">{children}</p>
    </li>
  );
}
