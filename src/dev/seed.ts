// Loads demo data: the sample voter file, volunteers, four lists and some contact history.
// Never imported by the app.
import { readFileSync } from "node:fs";
import path from "node:path";
import { faker } from "@faker-js/faker";
import type { ListKind, Outcome } from "@/lib/constants";
import { logContact } from "@/lib/contacts";
import { parseVoterCsv } from "@/lib/csv";
import { assignList, createList, getListVoters } from "@/lib/lists";
import { segmentSchema } from "@/lib/segments";
import { addVolunteer } from "@/lib/volunteers";
import { importVoters } from "@/lib/voters";
import { resetDatabase } from "./reset";

type ListPlan = {
  name: string;
  kind: ListKind;
  segment: Record<string, unknown>;
  volunteer: number | null;
  // Share of the list (from the top, in walk/call order) that has been worked.
  worked: number;
};

const LISTS: ListPlan[] = [
  { name: "P-03 doors · persuadables", kind: "door", segment: { precincts: ["P-03"], minScore: 35, maxScore: 65 }, volunteer: 0, worked: 0.85 },
  { name: "P-07 doors · persuadables", kind: "door", segment: { precincts: ["P-07"], minScore: 35, maxScore: 65 }, volunteer: 1, worked: 0.5 },
  { name: "P-01 doors · likely supporters", kind: "door", segment: { precincts: ["P-01"], minScore: 60 }, volunteer: 3, worked: 0.7 },
  { name: "GOTV calls · supporters 65+", kind: "phone", segment: { minAge: 65, minScore: 75 }, volunteer: 2, worked: 0.6 },
  { name: "Calls · undecided under 35", kind: "phone", segment: { maxAge: 34, minScore: 40, maxScore: 60 }, volunteer: 4, worked: 0.4 },
  { name: "P-11 doors · young supporters", kind: "door", segment: { precincts: ["P-11"], maxAge: 34, minScore: 70 }, volunteer: null, worked: 0 },
];

// Doors: most people aren't home. Phones: more wrong numbers.
const OUTCOME_ODDS: Record<ListKind, [Outcome, number][]> = {
  door: [["reached", 0.32], ["not_home", 0.62], ["wrong_number", 0.06]],
  phone: [["reached", 0.22], ["not_home", 0.58], ["wrong_number", 0.2]],
};

const CONVERSATION_NOTES = [
  "Wants a yard sign",
  "Asked where to vote",
  "Plans to vote early",
  "Interested in volunteering",
  "Concerned about property taxes",
  "Asked about the school bond",
  "Didn't want to talk politics",
];

function pickOutcome(kind: ListKind): Outcome {
  let roll = faker.number.float({ min: 0, max: 1 });
  for (const [outcome, odds] of OUTCOME_ODDS[kind]) {
    roll -= odds;
    if (roll <= 0) return outcome;
  }
  return "not_home";
}

/** People mostly answer in line with their model score, with some noise. */
function supportFromScore(score: number): number {
  const base = score >= 80 ? 1 : score >= 60 ? 2 : score >= 40 ? 3 : score >= 20 ? 4 : 5;
  const nudge = faker.helpers.weightedArrayElement([
    { value: 0, weight: 7 },
    { value: -1, weight: 1.5 },
    { value: 1, weight: 1.5 },
  ]);
  return Math.min(5, Math.max(1, base + nudge));
}

export async function seedDemoData(log: (message: string) => void = console.log): Promise<void> {
  await resetDatabase();

  // Same path as an upload: parse, validate, upsert.
  const csv = readFileSync(path.join(process.cwd(), "public", "sample-voters.csv"), "utf8");
  const { voters, errors } = parseVoterCsv(csv);
  const { inserted } = await importVoters(voters);
  log(`Imported ${inserted} voters; skipped ${errors.length} rows that are bad on purpose.`);

  faker.seed(7);
  const volunteerIds: number[] = [];
  for (let i = 0; i < 5; i++) {
    volunteerIds.push(await addVolunteer(`${faker.person.firstName()} ${faker.person.lastName()}`));
  }

  let attempts = 0;
  for (const plan of LISTS) {
    const listId = await createList({ name: plan.name, kind: plan.kind, segment: segmentSchema.parse(plan.segment) });
    if (plan.volunteer === null) continue;
    await assignList(listId, volunteerIds[plan.volunteer]);

    const onList = await getListVoters(listId);
    for (const voter of onList.slice(0, Math.round(onList.length * plan.worked))) {
      // A not-home sometimes gets a second knock or call.
      const tries = faker.datatype.boolean({ probability: 0.35 }) ? 2 : 1;
      for (let t = 0; t < tries; t++) {
        const outcome = pickOutcome(plan.kind);
        const reached = outcome === "reached";
        await logContact({
          listId,
          voterId: voter.id,
          outcome,
          support: reached ? supportFromScore(voter.support_score) : undefined,
          notes:
            reached && faker.datatype.boolean({ probability: 0.25 })
              ? faker.helpers.arrayElement(CONVERSATION_NOTES)
              : outcome === "wrong_number" && plan.kind === "door"
                ? "Moved; new residents"
                : undefined,
        });
        attempts++;
        if (outcome !== "not_home") break;
      }
    }
  }
  log(`Created ${volunteerIds.length} volunteers, ${LISTS.length} lists and ${attempts} contact attempts.`);
}
