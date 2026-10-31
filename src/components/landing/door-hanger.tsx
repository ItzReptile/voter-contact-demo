// The intro page's signature: the thing a volunteer leaves when nobody answers. A die cut
// card printed in two spot inks, with a hole and slit for the doorknob and "Not home" ticked.
// It swings once on its knob when the page loads, then hangs still (motion-safe only; the
// first frame is the resting position, so it is visible on first paint either way).
// Server Component: plain SVG, colors and type from the tokens and named styles in globals.css.

const OUTCOMES = [
  { label: "Reached", ticked: false },
  { label: "Not home", ticked: true },
  { label: "Moved", ticked: false },
];

export function DoorHanger({ className = "" }: { className?: string }) {
  return (
    // The pivot is the center of the knob hole: 44 of 560 units down the card.
    <div className={`origin-[50%_7.86%] motion-safe:animate-swing ${className}`}>
      <svg
        viewBox="0 0 256 560"
        role="img"
        aria-label="A door hanger that reads Sorry we missed you, with Not home ticked"
        className="block h-auto w-full"
      >
        <path
          d="M24.5 0.5h207a24 24 0 0 1 24 24v511a24 24 0 0 1-24 24h-207a24 24 0 0 1-24-24v-511a24 24 0 0 1 24-24Z"
          className="fill-paper stroke-line"
        />
        {/* Knob hole and slit, cut through to the stock behind. */}
        <circle cx="128" cy="44" r="26" className="fill-stock stroke-line" />
        <path d="M128 70v34" className="stroke-line" strokeWidth="2" />

        {/* Two inks, printed to the edge. */}
        <rect x="0" y="128" width="256" height="160" className="fill-indigo" />
        <rect x="0" y="288" width="256" height="36" className="fill-orange" />
        <text x="24" y="196" className="heading-2 fill-white">
          Sorry we
        </text>
        <text x="24" y="240" className="heading-2 fill-white">
          missed you
        </text>
        <text x="24" y="311" className="title-4 fill-ink">
          We’ll be back Saturday
        </text>

        {OUTCOMES.map(({ label, ticked }, index) => (
          <g key={label} transform={`translate(24 ${370 + index * 44})`}>
            <rect x="1" y="1" width="20" height="20" rx="4" fill="none" className="stroke-ink" strokeWidth="2" />
            {ticked && (
              <path
                d="M5 11l4 5 9-11"
                fill="none"
                // Ink, like the canvass card: an orange tick is kept for a conversation.
                className="stroke-ink"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <text x="36" y="17" className="body-2 fill-ink">
              {label}
            </text>
          </g>
        ))}

        <text x="24" y="510" className="caption-5 fill-muted">
          Left by Janae, P-03, 112 Cedar St
        </text>
        <path d="M24 520h208" className="stroke-line" />
      </svg>
    </div>
  );
}
