"use client";

import { DoorOpen } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Tag, type TagTone } from "./ui";

// The intro page's signature: a sample walk list where outcomes land on the doors one at a
// time, the progress bar fills and the contact rate counts up. It plays once, then holds.
// Reduced motion: it shows the finished state right away.

const DOORS: { address: string; outcome: string; tone: TagTone; reached: boolean }[] = [
  { address: "112 Cedar St", outcome: "Reached · 1", tone: "teal", reached: true },
  { address: "118 Cedar St", outcome: "Not home", tone: "orange", reached: false },
  { address: "124 Cedar St", outcome: "Not home", tone: "orange", reached: false },
  { address: "131 Cedar St", outcome: "Reached · 2", tone: "teal", reached: true },
  { address: "137 Cedar St", outcome: "Moved", tone: "plum", reached: false },
  { address: "142 Cedar St", outcome: "Reached · 3", tone: "teal", reached: true },
];

export function TurfCard() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = DOORS.map((_, index) =>
      setTimeout(() => setStep(index + 1), reduced ? 0 : 1100 + index * 450),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const conversations = DOORS.slice(0, step).filter((door) => door.reached).length;
  const rate = step === 0 ? null : Math.round((conversations / step) * 100);

  return (
    <figure
      aria-label="A sample turf: six doors on Cedar St, each getting an outcome"
      className="rounded-2xl border border-line bg-surface p-2 shadow-xl shadow-black/5"
    >
      <div className="flex items-center justify-between gap-4 px-4 pt-4 pb-3">
        <div>
          <p className="title-3">Cedar St · P-03</p>
          <p className="caption-5 text-muted">Sample turf, 6 doors in walk order</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-lg bg-accent-tint text-accent">
          <DoorOpen size={18} aria-hidden />
        </span>
      </div>
      <ol className="rounded-lg bg-subtle p-2">
        {DOORS.map((door, index) => {
          // The door being knocked right now is highlighted until its outcome lands.
          const current = index === step;
          return (
            <li
              key={door.address}
              className={`flex h-11 items-center justify-between gap-4 rounded-lg px-3 body-6 transition-colors duration-300 ${
                current ? "bg-accent-tint" : index % 2 === 1 ? "bg-surface" : ""
              }`}
            >
              <span className="flex items-center gap-3">
                <span className={`w-4 caption-5 tabular-nums ${current ? "text-accent" : "text-faint"}`}>{index + 1}</span>
                {door.address}
              </span>
              {index < step ? (
                <span className="motion-safe:animate-stamp">
                  <Tag tone={door.tone}>{door.outcome}</Tag>
                </span>
              ) : current ? (
                <span className="caption-4 text-accent-ink">Knocking</span>
              ) : (
                <span aria-hidden className="h-5 w-20 rounded-full border border-dashed border-line" />
              )}
            </li>
          );
        })}
      </ol>
      <div className="grid grid-cols-2 gap-4 px-4 pt-4 pb-3">
        <div>
          <p className="caption-4 text-muted">Doors attempted</p>
          <p className="mt-1 title-2 tabular-nums">
            {step} <span className="caption-2 text-faint">of {DOORS.length}</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent-tint">
            <div
              className="h-full origin-left rounded-full bg-accent transition-transform duration-500"
              style={{ transform: `scaleX(${step / DOORS.length})` }}
            />
          </div>
        </div>
        <div>
          <p className="caption-4 text-muted">Contact rate</p>
          <p className="mt-1 heading-5 text-accent tabular-nums" aria-live="polite">
            {rate === null ? "—" : `${rate}%`}
          </p>
        </div>
      </div>
      <p className={`px-4 pb-3 caption-5 text-muted transition-opacity duration-500 ${step === DOORS.length ? "opacity-100" : "opacity-0"}`}>
        Six doors, one tap each. The dashboard counts them the moment they are saved.
      </p>
    </figure>
  );
}
