// Loading states shaped like the real layouts (Suspense fallbacks), instead of spinners.
import type { ReactNode } from "react";

function Bone({ className }: { className: string }) {
  return <div className={`animate-skeleton rounded-lg bg-raised ${className}`} />;
}

function Loading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-label={label} aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

function CardBones({ rows }: { rows: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <Bone className="mb-6 h-6 w-40" />
      <div className="grid gap-4">
        {Array.from({ length: rows }, (_, i) => (
          <Bone key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 8, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <Loading label={label}>
      <CardBones rows={rows} />
    </Loading>
  );
}

export function DashboardSkeleton() {
  return (
    <Loading label="Loading the dashboard">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface p-4">
            <Bone className="mb-4 h-4 w-24" />
            <Bone className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <CardBones rows={3} />
        <CardBones rows={5} />
      </div>
      <CardBones rows={8} />
    </Loading>
  );
}

export function ListDetailSkeleton() {
  return (
    <Loading label="Loading the list">
      <Bone className="mb-2 h-9 w-72 max-w-full" />
      <Bone className="mb-8 h-4 w-96 max-w-full" />
      <div className="mb-6 grid gap-4 md:grid-cols-[2fr_1fr]">
        <CardBones rows={1} />
        <CardBones rows={1} />
      </div>
      <div className="grid gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface p-4">
            <Bone className="mb-4 h-5 w-64 max-w-full" />
            <Bone className="h-9 w-full" />
          </div>
        ))}
      </div>
    </Loading>
  );
}
