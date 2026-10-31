import { formatNumber, formatPercent, rate } from "@/lib/format";

export type BarSegment = { key: string; label: string; value: number; color: string };

/**
 * One horizontal bar split into parts of a whole, with a legend that labels every part
 * with its count and share, so nothing depends on telling colors apart.
 * Hovering a part shows the same numbers.
 */
export function StackedBar({ label, segments }: { label: string; segments: BarSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <figure>
      {total === 0 ? (
        <div className="h-3 rounded-full bg-raised" aria-hidden />
      ) : (
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden>
          {segments
            .filter((segment) => segment.value > 0)
            .map((segment) => (
              <div
                key={segment.key}
                title={`${segment.label}: ${formatNumber(segment.value)} (${formatPercent(rate(segment.value, total))})`}
                style={{ flexGrow: segment.value, flexBasis: 0, background: segment.color }}
              />
            ))}
        </div>
      )}
      <figcaption className="sr-only">{label}</figcaption>
      <table aria-label={label} className="mt-4 w-full body-6">
        <tbody>
          {segments.map((segment) => (
            <tr key={segment.key}>
              <td className="py-0.5">
                <span className="mr-2 inline-block size-3 rounded-sm align-middle" style={{ background: segment.color }} />
                {segment.label}
              </td>
              <td className="py-0.5 text-right tabular-nums">{formatNumber(segment.value)}</td>
              <td className="w-16 py-0.5 text-right tabular-nums text-ink-2">{formatPercent(rate(segment.value, total))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
