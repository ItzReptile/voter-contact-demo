"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A section that rises 32px and fades in the first time it enters the viewport.
 * IntersectionObserver, not a scroll listener. Reduced motion: fade only (motion-safe).
 */
export function Reveal({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect(); // reveal once; don't replay on scroll back up
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={id}
      data-reveal
      className={`transition-[opacity,transform] duration-700 ${
        shown ? "opacity-100" : "opacity-0 motion-safe:translate-y-8"
      } ${className}`}
    >
      {children}
    </section>
  );
}

/**
 * The tagline section: each word goes from a muted tone to full color, one at a time,
 * as the text scrolls up the screen. The scroll handler is throttled to one update per
 * animation frame. Reduced motion: full color right away.
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
            className={`transition-opacity duration-500 motion-reduce:opacity-100! ${index < active ? "opacity-100" : "opacity-30"}`}
          >
            {word}
          </span>
          {index < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
