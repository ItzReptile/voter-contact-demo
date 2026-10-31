// How domain values look in the UI: which tag tone each outcome and party gets.
// No database imports, so Client Components can use this file.
import type { Outcome } from "./constants";

export const OUTCOME_TONES: Record<Outcome, "teal" | "orange" | "plum"> = {
  reached: "teal",
  not_home: "orange",
  moved: "plum",
  wrong_number: "plum",
};

/** Chart series colors for outcomes (CSS variables from globals.css). */
export const OUTCOME_COLORS: Record<Outcome, string> = {
  reached: "var(--teal)",
  not_home: "var(--orange)",
  moved: "var(--plum)",
  wrong_number: "var(--plum)",
};

export const SHORT_OUTCOME_LABELS: Record<Outcome, string> = {
  reached: "Reached",
  not_home: "Not home",
  moved: "Moved",
  wrong_number: "Wrong number",
};
