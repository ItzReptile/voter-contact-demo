"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { UserError } from "@/lib/db";
import { assignList, createList } from "@/lib/lists";
import { listKindSchema, segmentSchema } from "@/lib/segments";

const createListSchema = z.object({
  name: z.string().trim().min(1, "Give the list a name").max(120, "Names are limited to 120 characters"),
  kind: listKindSchema,
  segment: segmentSchema,
});

function parseJson(value: FormDataEntryValue | null): unknown {
  try {
    return JSON.parse(String(value));
  } catch {
    return undefined;
  }
}

export type CreateListState = { error?: string };

export async function createListAction(_previous: CreateListState, formData: FormData): Promise<CreateListState> {
  // The segment arrives as JSON in a hidden field. It is validated again here:
  // never trust what the browser sends back.
  const parsed = createListSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    segment: parseJson(formData.get("segment")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let listId: number;
  try {
    listId = await createList(parsed.data);
  } catch (error) {
    if (error instanceof UserError) return { error: error.message };
    throw error;
  }
  // redirect() works by throwing, so it stays outside the try/catch.
  redirect(`/lists/${listId}`);
}

const assignSchema = z.object({
  listId: z.coerce.number().int().positive(),
  volunteerId: z.preprocess((value) => (value === "" ? null : value), z.coerce.number().int().positive().nullable()),
});

export async function assignListAction(formData: FormData): Promise<void> {
  const { listId, volunteerId } = assignSchema.parse({
    listId: formData.get("listId"),
    volunteerId: formData.get("volunteerId"),
  });
  await assignList(listId, volunteerId);
  refresh();
}
