import { Plus } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DoorHanger } from "@/components/landing/door-hanger";
import { TaglineReveal } from "@/components/reveal";
import { bigButtonClass, linkClass } from "@/components/ui";

// The intro page, printed like a door hanger: two spot inks on card stock. One audience
// (people who build or run voter contact tools), one action: open the demo.
// Indigo is the product and its actions; orange only appears where a door got an outcome.
// Motion is two moments: the hanger swings once on load, the tagline inks in on scroll.
// No testimonials or invented stats; every fact here is true of the demo itself.

export const metadata: Metadata = {
  title: { absolute: "Doorstep: cut turf, knock every door, count what happened" },
};

const REPO = "https://github.com/ItzReptile/voter-contact-demo";

const container = "mx-auto w-full max-w-6xl px-4 sm:px-8";

const BENEFITS = [
  {
    title: "Imports that explain themselves",
    text: "A bad row is skipped and named by line, like “Line 6: age must be at least 18”. The rest of the file still loads.",
  },
  {
    title: "Turf in walk order",
    text: "Door lists sort by street, then house number. Phone lists leave out voters without a number.",
  },
  {
    title: "Lists that hold still",
    text: "A list is a snapshot, so a new import never reshuffles the doors a volunteer is already walking.",
  },
  {
    title: "Numbers you can trace",
    text: "Contact rate is conversations divided by attempts, by day, precinct and list, counted from the rows volunteers saved.",
  },
];

const STEPS = [
  {
    title: "Import the voter file",
    text: "Upload a CSV with precinct, age, party, phone and a support score. Fix the rows it flags, or leave them out.",
  },
  {
    title: "Cut a list and assign it",
    text: "Filter by precinct, age, score and contact history, watch the count change, then hand the list to a volunteer.",
  },
  {
    title: "Log each door in one tap",
    text: "The volunteer view shows one voter at a time: a support ID, not home or moved, and on to the next door.",
  },
];

const FACTS = [
  { title: "Plain SQL on Postgres", text: "Every value is a parameter, including the filters that build a segment." },
  {
    title: "Rules in the database",
    text: "A support ID needs a conversation, and a contact needs a voter who is on that list. Constraints enforce both.",
  },
  { title: "Tests on every push", text: "Unit, database and browser tests run in GitHub Actions against a real Postgres." },
  {
    title: "Agent context in the repo",
    text: "A written plan, a CLAUDE.md with the rules, and skills for design and common changes.",
  },
];

const FAQ = [
  {
    q: "Is any of this real voter data?",
    a: "No. Every name, address and phone number comes from a script using Faker. Phone numbers use area code 555, which isn’t in service.",
  },
  {
    q: "Do I need an account?",
    a: "No. Open the demo and click around. There is no sign in, so whatever you change is visible to the next visitor.",
  },
  {
    q: "Can I break it?",
    a: "Edit anything you like. The data goes back to the starting set every night.",
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
    a: "I’m Jose Hernandez, a full stack engineer. I built this to show how I’d work on a voter contact tool.",
  },
];

export default function IntroPage() {
  return (
    <>
      <Hero />

      <section aria-label="The dashboard" className="pb-20 sm:pb-24">
        <figure className={container}>
          <div className="rounded-2xl border border-line bg-paper p-2">
            <Image
              src="/screenshots/dashboard.png"
              alt="The Doorstep dashboard: contact rate, attempts per day by outcome, support IDs and contact rate by precinct"
              width={1440}
              height={900}
              className="h-auto w-full rounded-lg"
              sizes="(min-width: 1152px) 1072px, 100vw"
              // On a desktop screen its top edge shows under the hero, so it is the largest paint.
              loading="eager"
            />
          </div>
          <figcaption className="mt-4 caption-2 text-muted">The dashboard, with the demo data loaded.</figcaption>
        </figure>
      </section>

      <section aria-labelledby="lists-heading" className="pb-20 sm:pb-24">
        <div className={`${container} grid gap-12 lg:grid-cols-12 lg:gap-8`}>
          <div className="lg:col-span-5">
            <h2 id="lists-heading" className="heading-3 sm:heading-2">
              A canvass runs on lists
            </h2>
            <p className="mt-4 max-w-xl body-3 text-ink-2">
              Volunteers need a short list in an order they can walk. Organizers need to know what happened at each
              door before the next shift. Here the voter file, every list cut from it and every logged attempt live in
              one Postgres database, so the dashboard counts the same rows volunteers saved.
            </p>
          </div>
          <ul className="grid gap-8 sm:grid-cols-2 lg:col-span-6 lg:col-start-7 lg:gap-x-8 lg:gap-y-12">
            {BENEFITS.map(({ title, text }) => (
              <li key={title}>
                <h3 className="heading-5">{title}</h3>
                <p className="mt-2 body-6 text-ink-2">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The one full width block of ink: the tagline, white on indigo like the hanger's band. */}
      <section aria-label="Tagline" className="bg-indigo py-20 text-white sm:py-24">
        <div className={container}>
          <TaglineReveal
            className="max-w-3xl heading-3 md:heading-2 lg:heading-1"
            lines={["Every knock is logged once.", "Every number on the dashboard", "traces back to a door."]}
          />
        </div>
      </section>

      <section id="how-it-works" aria-labelledby="how-heading" className="py-20 sm:py-24">
        <div className={container}>
          <h2 id="how-heading" className="heading-3 sm:heading-2">
            How it works
          </h2>
          <ol className="mt-12 grid gap-12 md:grid-cols-3 md:gap-8">
            {STEPS.map(({ title, text }, index) => (
              <li key={title} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 md:block">
                <span aria-hidden className="figure text-6xl text-indigo md:text-8xl">
                  {index + 1}
                </span>
                <div className="md:mt-6">
                  <h3 className="heading-5">{title}</h3>
                  <p className="mt-2 max-w-sm body-3 text-ink-2">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="code-heading" className="bg-paper py-20 sm:py-24">
        <div className={`${container} grid gap-12 lg:grid-cols-12 lg:gap-8`}>
          <div className="lg:col-span-5">
            <h2 id="code-heading" className="heading-3 sm:heading-2">
              Under the hood
            </h2>
            <p className="mt-4 max-w-md body-3 text-ink-2">The parts a reviewer would check first, all in the repository.</p>
            <a href={REPO} className={`${linkClass} mt-6 inline-block body-2`}>
              Read the code on GitHub
            </a>
          </div>
          <dl className="grid gap-8 sm:grid-cols-2 lg:col-span-7">
            {FACTS.map(({ title, text }) => (
              <div key={title}>
                <dt className="title-2">{title}</dt>
                <dd className="mt-2 body-6 text-ink-2">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="questions" aria-labelledby="faq-heading" className="py-20 sm:py-24">
        <div className={container}>
          <h2 id="faq-heading" className="heading-3 sm:heading-2">
            Questions
          </h2>
          <div className="mt-8 max-w-3xl divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-paper">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 title-3 transition-colors duration-200 ease-out -outline-offset-2 hover:bg-stock sm:px-6 [&::-webkit-details-marker]:hidden">
                  {q}
                  <Plus
                    size={16}
                    aria-hidden
                    className="shrink-0 text-indigo transition-transform duration-200 ease-out group-open:rotate-45"
                  />
                </summary>
                <p className="max-w-2xl px-4 pb-6 body-3 text-ink-2 sm:px-6">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="cta-heading" className="pt-8 pb-16 sm:pt-16">
        <div className={container}>
          <h2 id="cta-heading" className="max-w-[680px] heading-3 sm:heading-1">
            See it with the demo data loaded
          </h2>
          <p className="mt-4 max-w-xl body-3 text-ink-2">Nothing to install, and the data resets every night.</p>
          <DemoCta className="mt-8" />
        </div>
      </section>
    </>
  );
}

function Hero() {
  return (
    // overflow-x-clip: the hanger's swing never adds a sideways scroll on a phone.
    <section className="overflow-x-clip">
      <div className={`${container} grid items-center gap-16 pt-8 pb-20 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12 lg:pt-8 xl:gap-8`}>
        <div>
          <h1 className="heading-3 sm:heading-1 lg:text-7xl xl:text-8xl">
            <span className="block">Cut turf.</span>
            <span className="block text-indigo">Knock every door.</span>
            <span className="block">Count what happened.</span>
          </h1>
          <p className="mt-6 max-w-lg body-3 text-ink-2 sm:mt-8">
            A working demo of a voter contact tool for campaign field teams. Import a voter file, cut call lists and
            walkable turf, hand them to volunteers, and see every knock add up.
          </p>
          <DemoCta className="mt-8" />
        </div>
        <DoorHanger className="mx-auto w-56 lg:w-60 xl:w-64" />
      </div>
    </section>
  );
}

/** The one action, worded the same at the top and the bottom of the page. */
function DemoCta({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-6 gap-y-4 ${className}`}>
      <Link href="/dashboard" className={bigButtonClass}>
        Open the demo
      </Link>
      <p className="caption-2 text-muted">No sign in. 2,397 generated voters.</p>
    </div>
  );
}
