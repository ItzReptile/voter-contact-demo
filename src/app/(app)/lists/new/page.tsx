import { DoorOpen, Funnel, Phone } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BuilderSkeleton } from "@/components/skeletons";
import { EmptyState, InlineError, Num, PageHeader, Table, Tag } from "@/components/ui";
import { PendingRegion, UrlFilters } from "@/components/url-filters";
import { LIST_KIND_LABELS, PARTY_LABELS } from "@/lib/constants";
import { formatNumber, formatPhone } from "@/lib/format";
import { previewSegment } from "@/lib/lists";
import { describeSegment, listKindSchema, parseSegmentParams, suggestListName, toSearchParams } from "@/lib/segments";
import { listPrecincts } from "@/lib/voters";
import { CreateListForm } from "./create-list-form";
import { SegmentForm } from "./segment-form";

export const metadata: Metadata = { title: "New list" };

// The list builder: filters on the left, a live count and preview on the right.
// The filters live in the URL; the server renders the count for whatever the URL says.
export default function NewListPage({ searchParams }: PageProps<"/lists/new">) {
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/lists" className="caption-1 text-muted transition hover:text-ink">
            Lists
          </Link>
        }
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

  const KindIcon = kind === "door" ? DoorOpen : Phone;

  return (
    <UrlFilters>
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        <SegmentForm kind={kind} query={params.toString()} precincts={precincts} />

        <PendingRegion className="flex min-w-0 flex-col gap-6">
          {!parsed.ok && <InlineError>{parsed.error}</InlineError>}

          {parsed.ok && preview && (
            <>
              <section aria-label="Matching voters" className="rounded-xl border border-line bg-surface p-4 sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 caption-1 text-muted">
                      <KindIcon size={16} aria-hidden />
                      {LIST_KIND_LABELS[kind]}
                    </p>
                    <h2 className="mt-2 flex items-baseline gap-3">
                      <span className="heading-2 tabular-nums text-accent">{formatNumber(preview.count)}</span>{" "}
                      <span className="title-2 text-ink-2">{preview.count === 1 ? "voter matches" : "voters match"}</span>
                    </h2>
                    <p className="mt-2 caption-2 text-muted">{describeSegment(parsed.segment)}</p>
                  </div>
                </div>
                <div className="mt-6 border-t border-line-soft pt-6">
                  <CreateListForm
                    kind={kind}
                    segmentJson={JSON.stringify(parsed.segment)}
                    suggestedName={suggestListName(parsed.segment, kind)}
                    disabled={preview.count === 0}
                  />
                </div>
              </section>

              {preview.count === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center body-6 text-muted">
                  Nobody matches all of these filters. Loosen one and the count updates.
                </p>
              ) : (
                <section aria-label="Preview">
                  <h3 className="mb-3 title-4">
                    First {preview.sample.length} in {kind === "door" ? "walk" : "call"} order
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-line">
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
                            <td className="tabular-nums text-faint">{index + 1}</td>
                            <td className="whitespace-nowrap body-5">
                              {voter.first_name} {voter.last_name}
                            </td>
                            <td className="whitespace-nowrap">{kind === "door" ? voter.address : formatPhone(voter.phone)}</td>
                            <td>{voter.precinct}</td>
                            <Num>{voter.age}</Num>
                            <td>
                              <Tag dot={false}>{PARTY_LABELS[voter.party]}</Tag>
                            </td>
                            <Num>{voter.support_score}</Num>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </section>
              )}
            </>
          )}
        </PendingRegion>
      </div>
    </UrlFilters>
  );
}
