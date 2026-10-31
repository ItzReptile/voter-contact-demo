"use server";

import { refresh } from "next/cache";
import { parseVoterCsv, type RowError } from "@/lib/csv";
import { importVoters } from "@/lib/voters";

export type ImportState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "done"; inserted: number; updated: number; errors: RowError[]; errorCount: number };

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ERRORS_SHOWN = 25;

export async function importVotersAction(_previous: ImportState, formData: FormData): Promise<ImportState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose a CSV file to upload." };
  }
  if (file.size > MAX_BYTES) {
    return { status: "error", message: "Files are limited to 5 MB in this demo." };
  }

  const { voters, errors } = parseVoterCsv(await file.text());
  const { inserted, updated } = await importVoters(voters);

  refresh();
  return { status: "done", inserted, updated, errors: errors.slice(0, MAX_ERRORS_SHOWN), errorCount: errors.length };
}
