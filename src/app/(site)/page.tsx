import {
  ArrowRight,
  ChartBar,
  ChatCircleText,
  Database,
  FileCsv,
  ListChecks,
  Path,
  Plus,
  ShieldCheck,
  UploadSimple,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal, TaglineReveal } from "@/components/reveal";
import { TurfCard } from "@/components/turf-card";
import { bigButtonClass, linkClass } from "@/components/ui";

// The intro page. One audience (people who build or run voter contact tools), one action:
// open the demo. Layout A, classic hero plus sections; the signature is the turf card.
// No testimonials or invented stats; every fact here is true of the demo itself.

export const metadata: Metadata = {
  title: { absolute: "Doorstep: cut turf, log every door, know your contact rate" },
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
    text: "Contact rate is conversations divided by attempts, by day, precinct and list, counted from the rows volunteers saved.",
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
    text: "Filter by precinct, age, score and contact history, watch the count change, then hand the list to a volunteer.",
  },
  {
    Icon: ChatCircleText,
    title: "Log each door in one tap",
    text: "The volunteer view shows one voter at a time: a support ID, not home or moved, and on to the next door.",
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
    a: "Build a list for one precinct and watch the count change, assign it to a volunteer, open the canvass view and log a few doors, then check the dashboard.",
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
    a: "I'm Jose Hernandez, a full stack engineer. I built this to show how I'd work on a voter contact tool.",
  },
];

export default function IntroPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-8">
      <Hero />

      <Reveal className="mt-16">
        <p className="mb-4 text-center caption-1 text-muted">The dashboard, with the demo data loaded</p>
        <div className="rounded-2xl border border-line bg-surface p-2 shadow-xl shadow-black/5">
          <Image
            src="/screenshots/dashboard.png"
            alt="The Doorstep dashboard: contact rate, attempts per day by outcome, support IDs and contact rate by precinct"
            width={1440}
            height={900}
            className="h-auto w-full rounded-lg"
            sizes="(min-width: 1200px) 1136px, 100vw"
          />
        </div>
      </Reveal>

      <Reveal className="mx-auto mt-24 grid max-w-3xl gap-4 text-center">
        <h2 className="heading-4 sm:heading-3">A canvass runs on lists</h2>
        <p className="body-3 text-muted">
          Volunteers need a short list in an order they can walk. Organizers need to know what happened at each door
          before the next shift. Here the voter file, every list cut from it and every logged attempt live in one
          Postgres database, so the dashboard counts the same rows volunteers saved.
        </p>
      </Reveal>

      <Reveal className="mt-12">
        <h2 className="sr-only">What it does</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {BENEFITS.map(({ Icon, title, text }) => (
            <li key={title} className="rounded-2xl border border-line bg-surface p-6 transition hover:shadow-md">
              <div className="mb-6 flex size-10 items-center justify-center rounded-xl bg-accent-tint text-accent">
                <Icon size={20} aria-hidden />
              </div>
              <h3 className="title-2">{title}</h3>
              <p className="mt-2 body-6 text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </Reveal>

      <section aria-label="Tagline" className="mx-auto max-w-[680px] py-24 sm:py-32">
        <TaglineReveal
          className="heading-4 sm:heading-3"
          lines={["Every knock is logged once.", "Every number on the dashboard", "traces back to a door."]}
        />
      </section>

      <Reveal id="how-it-works" className="scroll-mt-24">
        <h2 className="mb-8 text-center heading-4 sm:heading-3">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ Icon, title, text }, index) => (
            <li key={title} className="rounded-2xl border border-line bg-surface p-6">
              <div className="mb-6 flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-full bg-accent caption-3 text-white">{index + 1}</span>
                <Icon size={20} aria-hidden className="text-faint" />
              </div>
              <h3 className="title-2">{title}</h3>
              <p className="mt-2 body-6 text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal className="mt-24 rounded-2xl border border-line bg-surface p-6 sm:p-12">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="heading-5 sm:heading-4">Under the hood</h2>
            <p className="mt-3 body-3 text-muted">The parts a reviewer would check first, all in the repository.</p>
            <a href={REPO} className={`${linkClass} mt-6 inline-flex items-center gap-2 body-2`}>
              Read the code on GitHub
              <ArrowRight size={16} aria-hidden />
            </a>
          </div>
          <ul className="grid gap-2">
            <Fact title="Plain SQL on Postgres">Every value is a parameter, including the filters that build a segment.</Fact>
            <Fact title="Rules in the database">
              A support ID needs a conversation, and a contact needs a voter who is on that list. Constraints enforce both.
            </Fact>
            <Fact title="Tests on every push">Unit, database and browser tests run in GitHub Actions against a real Postgres.</Fact>
            <Fact title="Agent context in the repo">A written plan, a CLAUDE.md with the rules, and skills for design and common changes.</Fact>
          </ul>
        </div>
      </Reveal>

      <Reveal id="questions" className="mx-auto mt-24 max-w-3xl scroll-mt-24">
        <h2 className="mb-8 text-center heading-4 sm:heading-3">Questions</h2>
        <div className="grid gap-2">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group rounded-2xl border border-line bg-surface px-6 py-4 transition hover:border-faint">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 title-3 [&::-webkit-details-marker]:hidden">
                {q}
                <Plus
                  size={16}
                  aria-hidden
                  className="shrink-0 text-muted transition-transform duration-500 group-open:rotate-45 motion-reduce:transition-none"
                />
              </summary>
              <p className="mt-3 body-6 text-muted">{a}</p>
            </details>
          ))}
        </div>
      </Reveal>

      <Reveal className="mt-24 flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-16 text-center">
        <h2 className="heading-4 sm:heading-3">See it with the demo data loaded</h2>
        <p className="mt-3 max-w-xl body-3 text-muted">No sign in, nothing to install, and the data resets every night.</p>
        <Link href="/dashboard" className={`${bigButtonClass} mt-8`}>
          Open the demo
          <ArrowRight size={18} weight="bold" aria-hidden />
        </Link>
      </Reveal>
    </div>
  );
}

function Hero() {
  // Each line rises in a little after the one before it.
  const rise = (delay: number) => ({ className: "motion-safe:animate-rise", style: { animationDelay: `${delay}ms` } });

  return (
    <section className="grid items-center gap-12 pt-16 pb-8 sm:pt-24 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-7">
        <p {...rise(0)}>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 caption-4 text-ink-2">
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            Demo · every voter is generated
          </span>
        </p>
        <h1 className={`mt-6 max-w-[680px] hero-gradient heading-3 sm:heading-1 ${rise(120).className}`} style={rise(120).style}>
          Cut turf, log every door,
          <br className="hidden sm:inline" /> know your contact rate
        </h1>
        <p className={`mt-6 max-w-xl body-3 text-muted ${rise(240).className}`} style={rise(240).style}>
          A working demo of a voter contact tool for campaign field teams. Import a voter file, build call lists and
          walkable turfs, hand them to volunteers, and see every attempt add up.
        </p>
        <div {...rise(360)}>
          <Link href="/dashboard" className={`${bigButtonClass} mt-8`}>
            Open the demo
            <ArrowRight size={18} weight="bold" aria-hidden />
          </Link>
        </div>
        <ul className={`mt-8 flex flex-wrap gap-x-6 gap-y-2 caption-1 text-muted ${rise(480).className}`} style={rise(480).style}>
          <li className="flex items-center gap-2">
            <ShieldCheck size={16} aria-hidden /> No sign in
          </li>
          <li className="flex items-center gap-2">
            <Database size={16} aria-hidden /> 2,397 generated voters
          </li>
          <li className="flex items-center gap-2">
            <ListChecks size={16} aria-hidden /> Resets every night
          </li>
        </ul>
      </div>
      <div className={`lg:col-span-5 ${rise(300).className}`} style={rise(300).style}>
        <TurfCard />
      </div>
    </section>
  );
}

function Fact({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="rounded-xl bg-subtle p-4 body-6">
      <p className="body-5 text-ink">{title}</p>
      <p className="mt-1 text-muted">{children}</p>
    </li>
  );
}
