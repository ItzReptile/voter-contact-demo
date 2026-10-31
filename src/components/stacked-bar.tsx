import { formatNumber, formatPercent, rate } from "@/lib/format";

/** `mark` is printed on the segment's swatch in `markColor` (pick the one that reads on `color`). */
export type BarSegment = { key: string; label: string; value: number; color: string; mark?: string; markColor?: string };

/**
 * One thick bar split into parts of a whole, with a key that labels every part with its count
 * and share, so nothing depends on telling inks apart. `ends` names the two ends of a scale
 * (support on the left, oppose on the right). Hovering a part shows the same numbers.
 */
export function StackedBar({ label, segments, ends }: { label: string; segments: BarSegment[]; ends?: [string, string] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <figure className="min-w-0">
      {total === 0 ? (
        <div className="h-8 rounded-md border border-dashed border-line" aria-hidden />
      ) : (
        <div className="flex h-8 gap-0.5 overflow-hidden rounded-md" aria-hidden>
          {segments
            .filter((segment) => segment.value > 0)
            .map((segment) => (
              <div
                key={segment.key}
                title={`${segment.label}: ${formatNumber(segment.value)} (${formatPercent(rate(segment.value, total))})`}
                className="transition-opacity duration-150 ease-out hover:opacity-80"
                style={{ flexGrow: segment.value, flexBasis: 0, background: segment.color }}
              />
            ))}
        </div>
      )}
      {ends && (
        <div aria-hidden className="mt-2 flex justify-between caption-4 text-muted">
          <span>{ends[0]}</span>
          <span>{ends[1]}</span>
        </div>
      )}
      <figcaption className="sr-only">{label}</figcaption>
      <table aria-label={label} className="mt-4 w-full body-6">
        <tbody>
          {segments.map((segment) => (
            <tr key={segment.key}>
              <td className="py-1 text-ink-2">
                <span className="flex items-center gap-3">
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-md caption-3 tabular-nums"
                    style={{ background: segment.color, color: segment.markColor }}
                  >
                    {segment.mark}
                  </span>
                  {segment.label}
                </span>
              </td>
              <td className="py-1 text-right body-4 tabular-nums">{formatNumber(segment.value)}</td>
              <td className="w-16 py-1 text-right tabular-nums text-muted">{formatPercent(rate(segment.value, total))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
