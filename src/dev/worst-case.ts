// Worst-case data for checking the UI (npm run seed -- --worst): the demo data plus the longest,
// shortest and oddest values each field accepts. Everything goes in through the same functions
// an upload, the volunteer form and the list builder use. Never imported by the app.
import type { ListKind } from "@/lib/constants";
import { logContact } from "@/lib/contacts";
import { parseVoterCsv } from "@/lib/csv";
import { assignList, createList, getListVoters } from "@/lib/lists";
import { segmentSchema } from "@/lib/segments";
import { addVolunteer } from "@/lib/volunteers";
import { importVoters } from "@/lib/voters";
import { seedDemoData } from "./seed";

// A long precinct name (the file format doesn't limit it) and a precinct with one voter.
const LONG_PRECINCT = "Ward 14 North Precinct 3";
const ONE_VOTER_PRECINCT = "P-98";

// Names, streets and cities have no length limit in the file or the database.
const WORST_VOTERS_CSV = `voter_id,first_name,last_name,address,city,zip,precinct,age,party,phone,support_score
WC0001,Aleksandra,Wiśniewska-Kowalczyk,12750 Martin Luther King Jr Memorial Boulevard Northeast,Rancho Santa Margarita,48990,${LONG_PRECINCT},120,DEM,,100
WC0002,Christopher Alexander,Montgomery III,4 Elm St,Oak Hollow,48991,${LONG_PRECINCT},18,REP,(555) 210-0001,0
WC0003,Jo,Ng,1 A St,Ely,48992,${LONG_PRECINCT},45,NPA,(555) 210-0002,50
WC0004,Đặng Thị Ngọc,Hân,88 Rue de la Paix,Riverbend,48990,${LONG_PRECINCT},67,OTH,(555) 210-0003,49
WC0005,Seán,O'Brien-Ó Súilleabháin,Rural Route 4 Box 112,Riverbend,48990,${LONG_PRECINCT},33,DEM,(555) 210-0004,51
WC0006,María José,de la Cruz y Fernández,99999 County Road 1200 North,Oak Hollow,48991,${LONG_PRECINCT},29,DEM,,72
WC0007,Konstantin,Oberhauser-Wettstein,301 Benachrichtigungseinstellungenstrasse,Riverbend,48990,${LONG_PRECINCT},52,REP,(555) 210-0005,38
WC0008,J,Li,2 B St,Ely,48992,${ONE_VOTER_PRECINCT},81,DEM,(555) 210-0006,88
`;

// Volunteer names are limited to 80 characters.
const WORST_VOLUNTEERS = [
  "Aleksandra Konstantina Wiśniewska-Kowalczyk Oberhauser-Wettstein de la Cruz",
  "Jo",
  "Seán O'Brien-Ó Súilleabháin",
];

// List names are limited to 120 characters.
const LONG_LIST_NAME =
  "Ward 14 North Precinct 3 persuadables not home on the first pass, second knock before early voting opens on the 14th";

const LONG_NOTE =
  "Talked for twenty minutes on the porch. Supports the school bond but is worried about property taxes going up again " +
  "after the reassessment. Wants a yard sign, but only after the HOA meeting on the 12th. Her son (Daniel) is 19 and " +
  "registered at this address but lives at college; he asked how to vote absentee. Left the absentee form and the " +
  "early voting hours. Dog is friendly. Use the side door; the front bell is broken. Call before 6pm on weekdays. Grandmother speaks Spanish.";

type WorstList = { name: string; kind: ListKind; segment: Record<string, unknown>; volunteer: number | null };

export async function seedWorstCase(log: (message: string) => void = console.log): Promise<void> {
  await seedDemoData(log);

  const { voters, errors } = parseVoterCsv(WORST_VOTERS_CSV);
  if (errors.length > 0) throw new Error(`Worst-case voters failed validation: ${JSON.stringify(errors)}`);
  await importVoters(voters);

  const volunteerIds: number[] = [];
  for (const name of WORST_VOLUNTEERS) volunteerIds.push(await addVolunteer(name));

  const lists: WorstList[] = [
    { name: LONG_LIST_NAME, kind: "door", segment: { precincts: [LONG_PRECINCT] }, volunteer: 0 },
    // One voter, so every count reads 1.
    { name: "J", kind: "door", segment: { precincts: [ONE_VOTER_PRECINCT] }, volunteer: 1 },
    // The biggest list the builder allows: every voter, unfiltered.
    { name: "Everyone", kind: "door", segment: {}, volunteer: null },
    // Every filter at once, which makes the longest description.
    {
      name: "Calls: every filter",
      kind: "phone",
      segment: {
        precincts: ["P-01", "P-02", "P-03", "P-04", "P-05", "P-06", LONG_PRECINCT],
        parties: ["DEM", "NPA", "OTH"],
        minAge: 18,
        maxAge: 120,
        minScore: 0,
        maxScore: 100,
        contact: "never_attempted",
      },
      volunteer: 2,
    },
  ];

  const listIds: number[] = [];
  for (const plan of lists) {
    const id = await createList({ name: plan.name, kind: plan.kind, segment: segmentSchema.parse(plan.segment) });
    listIds.push(id);
    if (plan.volunteer !== null) await assignList(id, volunteerIds[plan.volunteer]);
  }

  // The long list: a 500 character note, markup that must print as text, a note with a line break.
  const [first, second, third] = await getListVoters(listIds[0]);
  await logContact({ listId: listIds[0], voterId: first.id, outcome: "reached", support: 1, notes: LONG_NOTE });
  await logContact({ listId: listIds[0], voterId: second.id, outcome: "reached", support: 5, notes: "<b>No</b> &amp; never" });
  await logContact({ listId: listIds[0], voterId: third.id, outcome: "not_home", notes: "Left a flyer\nCome back Saturday" });

  // The one voter list, fully worked: 1 attempt, 1 reached, 100%.
  const [only] = await getListVoters(listIds[1]);
  await logContact({ listId: listIds[1], voterId: only.id, outcome: "reached", support: 3 });

  log(`Added ${voters.length} worst-case voters, ${volunteerIds.length} volunteers and ${lists.length} lists.`);
}
