// Display helpers. Pure functions, safe for Server and Client Components.

/** part / whole, or null when there is nothing to divide by (no attempts yet). */
export function rate(part: number, whole: number): number | null {
  return whole > 0 ? part / whole : null;
}

/** 0.4567 → "46%"; null → "—". */
export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

/** "5552345678" → "(555) 234-5678". */
export function formatPhone(phone: string | null): string {
  if (!phone) return "—";
  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    timeZone: "America/Detroit",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
