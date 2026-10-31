// How domain values look in the UI. No database imports, so Client Components can use this file.
// Two inks: orange for a conversation (the outcome that matters), indigo for everything else.
import type { Outcome } from "./constants";

export const OUTCOME_TONES: Record<Outcome, "orange" | "accent" | "ink"> = {
  reached: "orange",
  not_home: "accent",
  moved: "ink",
  wrong_number: "ink",
};

/** Chart series colors for outcomes (CSS variables from globals.css). */
export const OUTCOME_COLORS: Record<Outcome, string> = {
  reached: "var(--orange)",
  not_home: "var(--indigo)",
  moved: "var(--indigo-deep)",
  wrong_number: "var(--faint)",
};

/** Stacking order for charts: conversations sit on the baseline. */
export const OUTCOME_ORDER: Outcome[] = ["reached", "not_home", "moved", "wrong_number"];

export const SHORT_OUTCOME_LABELS: Record<Outcome, string> = {
  reached: "Reached",
  not_home: "Not home",
  moved: "Moved",
  wrong_number: "Wrong number",
};
