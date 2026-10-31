import { Funnel, Warning } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Form from "next/form";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { TableSkeleton } from "@/components/skeletons";
import { Card, EmptyState, inputClass, Num, PageHeader, secondaryButtonClass, Table } from "@/components/ui";
import {
  CONTACT_FILTER_LABELS,
  CONTACT_FILTERS,
  LIST_KIND_LABELS,
  LIST_KINDS,
  PARTIES,
  PARTY_LABELS,
} from "@/lib/constants";
import { formatNumber, formatPhone } from "@/lib/format";
import { previewSegment } from "@/lib/lists";
import { listKindSchema, parseSegmentParams, suggestListName, toSearchParams } from "@/lib/segments";
import { listPrecincts } from "@/lib/voters";
import { CreateListForm } from "./create-list-form";

export const metadata: Metadata = { title: "New list" };

// The segment builder is a GET form: filters live in the URL, this page renders the
// match count and a preview, and "Create list" posts the same filters to a Server Action.
export default function NewListPage({ searchParams }: PageProps<"/lists/new">) {
  return (
    <>
      <PageHeader
        title="New list"
        description="Pick who to contact. Leave a filter empty to include everyone. Preview, then create the list."
      />
      <Suspense fallback={<TableSkeleton rows={6} label="Loading the segment builder" />}>
        <SegmentBuilder searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SegmentBuilder({ searchParams }: Pick<PageProps<"/lists/new">, "searchParams">) {
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
      <EmptyState
        icon={<Funnel size={24} aria-hidden />}
        title="Import voters first"
        action={{ href: "/voters", label: "Import a voter file" }}
      >
        Segments filter the voter file by precinct, party, age, support score and contact history.
      </EmptyState>
    );
  }

  const checked = (name: string, value: string) => params.getAll(name).includes(value);

  return (
    <>
      <Card className="mb-6">
        <Form action="/lists/new" className="grid gap-6">
          <Fieldset legend="List type">
            {LIST_KINDS.map((value) => (
              <Choice key={value} type="radio" name="kind" value={value} defaultChecked={value === kind}>
                {LIST_KIND_LABELS[value]}
              </Choice>
            ))}
          </Fieldset>

          <Fieldset legend="Precincts">
            {precincts.map((precinct) => (
              <Choice key={precinct} name="precinct" value={precinct} defaultChecked={checked("precinct", precinct)}>
                {precinct}
              </Choice>
            ))}
          </Fieldset>

          <Fieldset legend="Party">
            {PARTIES.map((party) => (
              <Choice key={party} name="party" value={party} defaultChecked={checked("party", party)}>
                {PARTY_LABELS[party]}
              </Choice>
            ))}
          </Fieldset>

          <div className="flex flex-wrap gap-6">
            <Range label="Age" name="Age" min={18} max={120} params={params} />
            <Range label="Support score" name="Score" min={0} max={100} params={params} />
            <label className="flex flex-col gap-2 title-4">
              Contact history
              <select name="contact" defaultValue={params.get("contact") ?? "any"} className={inputClass}>
                {CONTACT_FILTERS.map((value) => (
                  <option key={value} value={value}>
                    {CONTACT_FILTER_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <button type="submit" className={secondaryButtonClass}>
              <Funnel size={16} aria-hidden />
              Preview
            </button>
          </div>
        </Form>
      </Card>

      {!parsed.ok && (
        <p role="alert" className="mb-6 flex items-center gap-2 body-5 text-danger">
          <Warning size={20} aria-hidden />
          {parsed.error}
        </p>
      )}

      {parsed.ok && preview && (
        <Card>
          <h2 className="mb-4 heading-6">
            {formatNumber(preview.count)} {preview.count === 1 ? "voter matches" : "voters match"}
          </h2>

          <div className="mb-6">
            <CreateListForm
              kind={kind}
              segmentJson={JSON.stringify(parsed.segment)}
              suggestedName={suggestListName(parsed.segment, kind)}
              disabled={preview.count === 0}
            />
          </div>

          {preview.count === 0 ? (
            <p className="body-6 text-ink-2">Nobody matches all of these filters. Loosen one and preview again.</p>
          ) : (
            <>
              <h3 className="mb-2 title-4 text-ink-2">
                First {preview.sample.length} in {kind === "door" ? "walk" : "call"} order
              </h3>
              <Table label="Preview">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>{kind === "door" ? "Address" : "Phone"}</th>
                    <th>Precinct</th>
                    <th className="text-right">Age</th>
                    <th>Party</th>
                    <th className="text-right">Support score</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.sample.map((voter) => (
                    <tr key={voter.id}>
                      <td className="whitespace-nowrap">
                        {voter.first_name} {voter.last_name}
                      </td>
                      <td className="whitespace-nowrap">{kind === "door" ? voter.address : formatPhone(voter.phone)}</td>
                      <td>{voter.precinct}</td>
                      <Num>{voter.age}</Num>
                      <td>{PARTY_LABELS[voter.party]}</td>
                      <Num>{voter.support_score}</Num>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Card>
      )}
    </>
  );
}

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 title-4">{legend}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2">{children}</div>
    </fieldset>
  );
}

function Choice({
  type = "checkbox",
  name,
  value,
  defaultChecked,
  children,
}: {
  type?: "checkbox" | "radio";
  name: string;
  value: string;
  defaultChecked: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 body-6 transition hover:bg-raised has-[:checked]:border-button has-[:checked]:bg-raised">
      <input type={type} name={name} value={value} defaultChecked={defaultChecked} className="accent-button" />
      {children}
    </label>
  );
}

function Range({
  label,
  name,
  min,
  max,
  params,
}: {
  label: string;
  name: string;
  min: number;
  max: number;
  params: URLSearchParams;
}) {
  return (
    <fieldset>
      <legend className="mb-2 title-4">{label}</legend>
      <div className="flex items-center gap-2">
        <input
          type="number"
          name={`min${name}`}
          aria-label={`Minimum ${label.toLowerCase()}`}
          placeholder="min"
          min={min}
          max={max}
          defaultValue={params.get(`min${name}`) ?? ""}
          className={`${inputClass} w-24`}
        />
        <span className="body-6 text-ink-2">to</span>
        <input
          type="number"
          name={`max${name}`}
          aria-label={`Maximum ${label.toLowerCase()}`}
          placeholder="max"
          min={min}
          max={max}
          defaultValue={params.get(`max${name}`) ?? ""}
          className={`${inputClass} w-24`}
        />
      </div>
    </fieldset>
  );
}
