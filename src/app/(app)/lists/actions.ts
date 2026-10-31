"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { OUTCOME_LABELS, SUPPORT_LABELS } from "@/lib/constants";
import { contactSchema, logContact, parseCanvassChoice, undoContact } from "@/lib/contacts";
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

export type CanvassState =
  | { status: "idle" }
  // contactId and voterName let the volunteer undo this save; reached picks the ink of the tick.
  | { status: "saved"; message: string; reached: boolean; contactId: number; voterName: string }
  | { status: "undone"; message: string }
  | { status: "error"; message: string };

/** One tap in the canvass view: the clicked button's "choice" says the outcome and support ID. */
export async function logCanvassAction(_previous: CanvassState, formData: FormData): Promise<CanvassState> {
  const choice = parseCanvassChoice(formData.get("choice"));
  if (!choice) return { status: "error", message: "Pick an outcome for this voter." };

  const parsed = contactSchema.safeParse({
    listId: formData.get("listId"),
    voterId: formData.get("voterId"),
    outcome: choice.outcome,
    support: choice.support,
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };

  let contactId: number;
  try {
    contactId = await logContact(parsed.data);
  } catch (error) {
    if (error instanceof UserError) return { status: "error", message: error.message };
    throw error;
  }

  refresh();
  const who = String(formData.get("voterName") ?? "the voter");
  const what = choice.support ? `${OUTCOME_LABELS.reached}, ${SUPPORT_LABELS[choice.support].toLowerCase()}` : OUTCOME_LABELS[choice.outcome];
  return {
    status: "saved",
    message: `Saved for ${who}: ${what}.`,
    reached: choice.outcome === "reached",
    contactId,
    voterName: who,
  };
}

const undoSchema = z.object({ contactId: z.coerce.number().int().positive() });

/** Takes back the last tap in the canvass view. The voter has no attempt again, so they are the current card. */
export async function undoCanvassAction(_previous: CanvassState, formData: FormData): Promise<CanvassState> {
  const parsed = undoSchema.safeParse({ contactId: formData.get("contactId") });
  if (!parsed.success) return { status: "error", message: "There is nothing to undo." };

  try {
    await undoContact(parsed.data.contactId);
  } catch (error) {
    if (error instanceof UserError) return { status: "error", message: error.message };
    throw error;
  }

  refresh();
  const who = String(formData.get("voterName") ?? "The voter");
  return { status: "undone", message: `Undone. ${who} is back on the list.` };
}
