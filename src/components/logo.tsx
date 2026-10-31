/** The Doorstep mark: a door on a rounded square. */
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="8" fill="#5D69A1" />
      <path d="M11 25V9.5A2.5 2.5 0 0 1 13.5 7h5A2.5 2.5 0 0 1 21 9.5V25" stroke="#fff" strokeWidth="2" fill="none" />
      <path d="M8 25h16" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="16.5" r="1.4" fill="#fff" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="title-3 tracking-tight">Doorstep</span>
    </span>
  );
}
