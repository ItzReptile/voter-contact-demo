"use server";

import { refresh } from "next/cache";
import { UserError } from "@/lib/db";
import { addVolunteer, volunteerNameSchema } from "@/lib/volunteers";

export type AddVolunteerState = { error?: string; savedCount: number };

export async function addVolunteerAction(previous: AddVolunteerState, formData: FormData): Promise<AddVolunteerState> {
  const parsed = volunteerNameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { ...previous, error: parsed.error.issues[0].message };

  try {
    await addVolunteer(parsed.data);
  } catch (error) {
    if (error instanceof UserError) return { ...previous, error: error.message };
    throw error;
  }

  refresh();
  return { savedCount: previous.savedCount + 1 };
}
