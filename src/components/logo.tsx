/** The Doorstep mark: a tiny door hanger, two inks and a knob hole. */
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 32" aria-hidden className={className}>
      <rect x="0" y="0" width="24" height="32" rx="6" fill="#5D69A1" />
      <circle cx="12" cy="7" r="3.5" fill="#F7F8FC" />
      <rect x="0" y="21" width="24" height="4" fill="#F8922F" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark className="h-7 w-5" />
      <span className="heading-6">Doorstep</span>
    </span>
  );
}
