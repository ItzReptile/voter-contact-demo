import { DoorOpen, Funnel, Phone } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { BuilderSkeleton } from "@/components/skeletons";
import { BackLink, EmptyState, Hanger, InlineError, Num, PageHeader, Table } from "@/components/ui";
import { PendingRegion, UrlFilters } from "@/components/url-filters";
import { LIST_KIND_LABELS, PARTY_LABELS, type ListKind } from "@/lib/constants";
import { formatNumber, formatPhone } from "@/lib/format";
import { previewSegment } from "@/lib/lists";
import {
  describeSegment,
  listKindSchema,
  parseSegmentParams,
  suggestListName,
  toSearchParams,
  type Segment,
  type SegmentErrors,
} from "@/lib/segments";
import { listPrecincts } from "@/lib/voters";
import { CreateListForm } from "./create-list-form";
import { SegmentForm } from "./segment-form";

export const metadata: Metadata = { title: "New list" };

// A rule of thumb, not a statistic: one volunteer knocks about 50 doors in a shift.
// Past three shifts, a door list is more than one volunteer's turf.
const DOORS_PER_SHIFT = 50;
const ONE_TURF = 150;

// The list builder: filters on the left, a live count and preview on the right.
// The filters live in the URL; the server renders the count for whatever the URL says.
export default function NewListPage({ searchParams }: PageProps<"/lists/new">) {
  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/lists">Lists</BackLink>}
        title="New list"
        description="Pick who to contact. The count updates as you change filters. Leave a filter empty to include everyone."
      />
      <Suspense fallback={<BuilderSkeleton />}>
        <Builder searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Builder({ searchParams }: Pick<PageProps<"/lists/new">, "searchParams">) {
  await connection();
  const params = toSearchParams(await searchParams);
  const kindResult = listKindSchema.safeParse(params.get("kind") ?? "door");
  const kind = kindResult.success ? kindResult.data : "door";
  const parsed = parseSegmentParams(params);

  const [precincts, preview] = await Promise.all([
    listPrecincts(),
    parsed.ok ? previewSegment(parsed.segment, kind) : null,
  ]);

  if (precincts.length === 0) {
    return (
      <EmptyState icon={<Funnel size={24} aria-hidden />} title="Import voters first" action={{ href: "/voters/import", label: "Import a voter file" }}>
        Segments filter the voter file by precinct, party, age, support score and contact history.
      </EmptyState>
    );
  }

  const order = kind === "door" ? "walk" : "call";
  const count = parsed.ok && preview ? preview.count : null;

  // Columns follow the space the builder has, not the window, and the tracks are in rem:
  // at 200% text the builder drops to one column instead of squeezing the hanger.
  return (
    <UrlFilters>
      <div className="@container">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 @4xl:grid-cols-[22.5rem_minmax(0,1fr)] @4xl:items-start">
          <SegmentForm kind={kind} query={params.toString()} precincts={precincts} count={count} errors={parsed.ok ? {} : parsed.errors} />

          <PendingRegion className="@container flex min-w-0 flex-col gap-8">
            <section
              id="matching-voters"
              aria-label="Matching voters"
              className="grid scroll-mt-24 grid-cols-[minmax(0,1fr)] gap-6 @xl:grid-cols-[18rem_minmax(0,1fr)] @xl:items-start @xl:gap-8"
            >
              <CountHanger kind={kind} count={count} segment={parsed.ok ? describeSegment(parsed.segment) : null} />

              <div className="flex min-w-0 flex-col gap-4 @xl:pt-16">
                {!parsed.ok || !preview ? (
                  <FixFirst errors={parsed.ok ? {} : parsed.errors} />
                ) : (
                  <>
                    <h2 className="heading-5">{preview.count === 0 ? "No list to create yet" : "Create this list"}</h2>
                    <p className="max-w-md body-6 text-ink-2">
                      {preview.count === 0
                        ? "Nobody matches all of these filters. Loosen one and the count updates."
                        : `Creating it saves ${preview.count === 1 ? "this voter" : `these ${formatNumber(preview.count)} voters`} in ${order} order. Later imports won't change who is on it.`}
                    </p>
                    <CreateListForm
                      kind={kind}
                      segmentJson={JSON.stringify(parsed.segment)}
                      suggestedName={suggestListName(parsed.segment, kind)}
                      disabled={preview.count === 0}
                      note={turfNote(kind, preview.count, parsed.segment)}
                    />
                  </>
                )}
              </div>
            </section>

            {parsed.ok && preview && preview.count > 0 && (
              <section aria-labelledby="preview-heading" className="min-w-0">
                <h3 id="preview-heading" className="mb-3 heading-6">
                  {preview.count === 1
                    ? `The only match`
                    : preview.count > preview.sample.length
                      ? `First ${preview.sample.length} in ${order} order`
                      : `All ${preview.sample.length} in ${order} order`}
                </h3>
                <div className="overflow-hidden rounded-2xl border border-line bg-paper">
                  <Table label="Preview">
                    <thead>
                      <tr>
                        <th className="w-12">#</th>
                        <th>Name</th>
                        <th>{kind === "door" ? "Address" : "Phone"}</th>
                        <th>Precinct</th>
                        <th className="text-right">Age</th>
                        <th>Party</th>
                        <th className="text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.sample.map((voter, index) => (
                        <tr key={voter.id}>
                          <td className="tabular-nums text-muted">{index + 1}</td>
                          <td className="whitespace-nowrap body-5">
                            {voter.first_name} {voter.last_name}
                          </td>
                          <td className="whitespace-nowrap">{kind === "door" ? voter.address : formatPhone(voter.phone)}</td>
                          <td className="whitespace-nowrap">{voter.precinct}</td>
                          <Num>{voter.age}</Num>
                          <td className="whitespace-nowrap text-ink-2">{PARTY_LABELS[voter.party]}</td>
                          <Num>{voter.support_score}</Num>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </section>
            )}
          </PendingRegion>
        </div>
      </div>
    </UrlFilters>
  );
}

/**
 * The live count, printed on a door hanger: the indigo band carries the screen's one big
 * number. With nobody matching (or filters that can't match) there is nothing to print, so
 * the band goes blank. The heading is a polite live region: screen readers hear the new count.
 */
function CountHanger({ kind, count, segment }: { kind: ListKind; count: number | null; segment: string | null }) {
  const KindIcon = kind === "door" ? DoorOpen : Phone;
  const figure = count === null ? null : formatNumber(count);
  // Each step turns on once the band is wide enough for the figure at that size ("2,397" is
  // about 2em wide). The widths are in rem like the type, so the figure fits at 200% text too.
  const size =
    !figure || figure.length <= 3
      ? "text-5xl @[6.5rem]:text-7xl @[11.25rem]:text-9xl"
      : figure.length <= 5
        ? "text-4xl @[6.5rem]:text-5xl @[9.5rem]:text-7xl @[12.5rem]:text-8xl"
        : "text-4xl @[9rem]:text-5xl @[13.5rem]:text-7xl";

  return (
    <Hanger className="mx-auto w-full max-w-72 overflow-hidden @xl:mx-0">
      <div className={`@container px-6 pt-6 pb-8 ${count ? "bg-indigo text-white" : "bg-soft text-ink-2"}`}>
        <p className="flex items-center gap-2 caption-1">
          <KindIcon size={16} aria-hidden />
          {LIST_KIND_LABELS[kind]}
        </p>
        <h2 aria-live="polite" className="mt-4">
          {figure === null ? (
            <span className="block heading-4">No count yet</span>
          ) : (
            <>
              <span className={`block figure tracking-tight ${size}`}>{figure}</span>{" "}
              <span className="mt-2 block heading-5">{count === 1 ? "voter matches" : "voters match"}</span>
            </>
          )}
        </h2>
      </div>
      <p className="px-6 pt-4 pb-6 caption-2 [overflow-wrap:anywhere] text-ink-2">
        {segment ?? "Fix the filters to see who matches."}
      </p>
    </Hanger>
  );
}

/** In place of the create step while a filter can't match: what to fix first. The details sit under the fields. */
function FixFirst({ errors }: { errors: SegmentErrors }) {
  if (errors.other) {
    return (
      <>
        <h2 className="heading-5">Check the filters</h2>
        <InlineError>{errors.other}</InlineError>
      </>
    );
  }
  const ranges = errors.age && errors.score ? "age and support score ranges" : errors.age ? "age range" : "support score range";
  return (
    <>
      <h2 className="heading-5">Fix the {ranges} first</h2>
      <p className="max-w-md body-6 text-ink-2">
        The note under those fields says what to change. Then the count and the preview come back.
      </p>
    </>
  );
}

/**
 * A door list bigger than one volunteer can walk gets a note with the rough number of shifts
 * and how to split it. It never blocks creating the list. Phone lists get no note: calls go
 * much faster than walking between doors, and there is no shift number worth quoting.
 */
function turfNote(kind: ListKind, count: number, segment: Segment): string | null {
  if (kind !== "door" || count <= ONE_TURF) return null;
  const shifts = `A volunteer knocks about ${DOORS_PER_SHIFT} doors in a shift, so this is about ${formatNumber(Math.round(count / DOORS_PER_SHIFT))} shifts.`;
  return segment.precincts.length === 1
    ? `${shifts} To fit one shift, narrow it by support score or contact history.`
    : `${shifts} Create one list per precinct so each volunteer gets one turf.`;
}
