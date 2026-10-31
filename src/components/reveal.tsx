"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The tagline section: each word inks in, from 30% of the text color to full, one at a time,
 * as the text scrolls up the screen. Words take their color from the parent, so the same
 * reveal works in ink on stock or in white on the indigo band. The scroll handler is throttled
 * to one update per animation frame. Reduced motion: full color right away.
 * `lines` are the meaningful line breaks, kept from the sm breakpoint up.
 */
export function TaglineReveal({ lines, className = "" }: { lines: string[]; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = lines.flatMap((line, lineIndex) =>
    line.split(" ").map((word, wordIndex) => ({ word, breakBefore: lineIndex > 0 && wordIndex === 0 })),
  );
  const [active, setActive] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const element = ref.current;
      if (!element) return;
      const { top, height } = element.getBoundingClientRect();
      // 0 when the text's top reaches 85% down the screen, 1 when its bottom reaches 45%.
      const start = window.innerHeight * 0.85;
      const end = window.innerHeight * 0.45;
      const progress = (start - top) / (start - end + height);
      setActive(Math.round(Math.min(1, Math.max(0, progress)) * words.length));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [words.length]);

  return (
    <p ref={ref} className={className}>
      {words.map(({ word, breakBefore }, index) => (
        <span key={index}>
          {breakBefore && <br className="hidden sm:inline" />}
          <span
            className={`transition-opacity duration-250 motion-reduce:opacity-100! ${index < active ? "opacity-100" : "opacity-30"}`}
          >
            {word}
          </span>
          {index < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
