// Loading states shaped like the real layouts (Suspense fallbacks), instead of spinners.
import type { ReactNode } from "react";

function Bone({ className }: { className: string }) {
  return <div className={`animate-skeleton rounded-md bg-hover ${className}`} />;
}

function Loading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-label={label} aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

function TableBones({ rows }: { rows: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="flex gap-6 bg-subtle px-4 py-3">
        {["w-24", "w-32", "w-16", "w-20"].map((width) => (
          <Bone key={width} className={`h-3 ${width}`} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-6 border-t border-line-soft px-4 py-4">
          <Bone className="h-4 w-40" />
          <Bone className="h-4 w-48" />
          <Bone className="h-4 w-12" />
          <Bone className="ml-auto h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <Loading label={label}>
      <TableBones rows={rows} />
    </Loading>
  );
}

function CardBones({ className = "h-64" }: { className?: string }) {
  return (
    <div className="rounded-xl border border-line p-6">
      <Bone className="mb-6 h-4 w-40" />
      <Bone className={`w-full ${className}`} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <Loading label="Loading the dashboard">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border border-line p-6">
            <Bone className="mb-4 h-3 w-24" />
            <Bone className="mb-4 h-8 w-20" />
            <Bone className="h-8 w-full" />
          </div>
        ))}
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CardBones className="h-64" />
        </div>
        <CardBones className="h-64" />
      </div>
      <TableBones rows={5} />
    </Loading>
  );
}

export function BuilderSkeleton() {
  return (
    <Loading label="Loading the list builder">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <CardBones className="h-96" />
        <div className="grid gap-6">
          <CardBones className="h-24" />
          <TableBones rows={6} />
        </div>
      </div>
    </Loading>
  );
}

export function ListDetailSkeleton() {
  return (
    <Loading label="Loading the list">
      <Bone className="mb-2 h-3 w-24" />
      <Bone className="mb-8 h-8 w-80 max-w-full" />
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border border-line p-4">
            <Bone className="mb-3 h-3 w-16" />
            <Bone className="h-6 w-12" />
          </div>
        ))}
      </div>
      <TableBones rows={6} />
    </Loading>
  );
}

export function CanvassSkeleton() {
  return (
    <Loading label="Loading the next voter">
      <div className="mx-auto max-w-xl">
        <Bone className="mb-4 h-3 w-32" />
        <Bone className="mb-8 h-2 w-full" />
        <div className="rounded-2xl border border-line p-6">
          <Bone className="mb-3 h-3 w-24" />
          <Bone className="mb-2 h-7 w-56" />
          <Bone className="mb-8 h-5 w-40" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Bone key={i} className="h-16" />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Bone className="h-12" />
            <Bone className="h-12" />
          </div>
        </div>
      </div>
    </Loading>
  );
}
