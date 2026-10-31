import Form from "next/form";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { Card, EmptyState, inputClass, Loading, Num, PageHeader, secondaryButtonClass, Table } from "@/components/ui";
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

// The segment builder is a GET form: filters live in the URL, this page renders the
// match count and a preview, and "Create list" posts the same filters to a Server Action.
export default function NewListPage({ searchParams }: PageProps<"/lists/new">) {
  return (
    <>
      <PageHeader
        title="New list"
        description="Pick who to contact. Leave a filter empty to include everyone. Preview, then create the list."
      />
      <Suspense fallback={<Loading />}>
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

  const checked = (name: string, value: string) => params.getAll(name).includes(value);

  return (
    <>
      <Card className="mb-6">
        <Form action="/lists/new" className="grid gap-5">
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
            {precincts.length === 0 && <span className="text-sm text-ink-2">Import voters first.</span>}
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
            <label className="flex flex-col gap-1 text-sm">
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
              Preview
            </button>
          </div>
        </Form>
      </Card>

      {!parsed.ok && (
        <p role="alert" className="mb-6 text-sm text-danger">
          {parsed.error}
        </p>
      )}

      {parsed.ok && preview && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold">
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
            <EmptyState>No voters match. Loosen a filter.</EmptyState>
          ) : (
            <>
              <h3 className="mb-2 text-sm font-medium text-ink-2">
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
                      <td>
                        {voter.first_name} {voter.last_name}
                      </td>
                      <td>{kind === "door" ? voter.address : formatPhone(voter.phone)}</td>
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
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
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
    <label className="flex items-center gap-1.5 text-sm">
      <input type={type} name={name} value={value} defaultChecked={defaultChecked} />
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
      <legend className="mb-1 text-sm">{label}</legend>
      <div className="flex items-center gap-2">
        <input
          type="number"
          name={`min${name}`}
          aria-label={`Minimum ${label.toLowerCase()}`}
          placeholder="min"
          min={min}
          max={max}
          defaultValue={params.get(`min${name}`) ?? ""}
          className={`${inputClass} w-20`}
        />
        <span className="text-ink-2">to</span>
        <input
          type="number"
          name={`max${name}`}
          aria-label={`Maximum ${label.toLowerCase()}`}
          placeholder="max"
          min={min}
          max={max}
          defaultValue={params.get(`max${name}`) ?? ""}
          className={`${inputClass} w-20`}
        />
      </div>
    </fieldset>
  );
}
