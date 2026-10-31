// Test helpers. Never imported by the app.
import type { VoterInput } from "@/lib/csv";
import { splitAddress } from "@/lib/csv";
import { assertTestDatabase, resetDatabase } from "./reset";

export async function freshTestDatabase(): Promise<void> {
  assertTestDatabase();
  await resetDatabase();
}

let nextId = 1;

/** A valid voter; override only the fields a test cares about. */
export function makeVoter(overrides: Partial<VoterInput> = {}): VoterInput {
  const address = overrides.address ?? `${100 + nextId} Oak St`;
  return {
    voterFileId: `T${nextId++}`,
    firstName: "Test",
    lastName: "Voter",
    city: "Riverbend",
    zip: "48990",
    precinct: "P-01",
    age: 40,
    party: "DEM",
    phone: "5552000000",
    supportScore: 50,
    ...overrides,
    address,
    ...splitAddress(address),
  };
}
