// Pure helpers for the dashboard charts.

/** A round axis top and evenly spaced ticks (steps of 1, 2 or 5 times a power of ten). */
export function niceScale(max: number, steps = 4): { top: number; ticks: number[] } {
  const raw = Math.max(max, 1) / steps;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * power).find((candidate) => candidate >= raw) ?? 10 * power;
  // Whole numbers only: counts can't be fractional.
  const wholeStep = Math.max(1, Math.round(step));
  return { top: wholeStep * steps, ticks: Array.from({ length: steps + 1 }, (_, i) => i * wholeStep) };
}

/** "2026-10-31" → "Oct 31". The day is a calendar date, so it is read as UTC to avoid shifting it. */
export function formatDay(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** SVG path for a sparkline in a width × height box. */
export function sparklinePath(values: number[], width: number, height: number): string {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  const x = (i: number) => (values.length === 1 ? width / 2 : (i / (values.length - 1)) * width);
  const y = (v: number) => height - (v / max) * height;
  return values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(" ");
}
