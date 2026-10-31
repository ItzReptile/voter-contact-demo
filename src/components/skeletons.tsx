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

/** The hole and slit at the top of a hanger placeholder. */
function HangerTop() {
  return (
    <>
      <span className="absolute top-4 left-1/2 size-8 -translate-x-1/2 rounded-full border border-line bg-stock" />
      <span className="absolute top-12 left-1/2 h-4 w-0.5 -translate-x-1/2 bg-line" />
    </>
  );
}

function TableBones({ rows }: { rows: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-paper">
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


// Matches the dashboard: the hanger beside the daily chart, support and lists, then precinct tags.
export function DashboardSkeleton() {
  return (
    <Loading label="Loading the dashboard">
      <div className="mb-12 grid grid-cols-[minmax(0,1fr)] gap-12 md:grid-cols-[18rem_minmax(0,1fr)] lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="relative h-[29rem] rounded-3xl border border-line bg-paper">
          <span className="absolute top-4 left-1/2 size-8 -translate-x-1/2 rounded-full border border-line bg-stock" />
          <div className="px-6 pt-20">
            <Bone className="mb-4 h-24 w-40" />
            <Bone className="h-4 w-48" />
          </div>
        </div>
        <div>
          <Bone className="mb-3 h-7 w-48" />
          <Bone className="mb-6 h-4 w-72 max-w-full" />
          <Bone className="h-56 w-full sm:h-64 lg:h-80" />
        </div>
      </div>
      <div className="mb-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div>
          <Bone className="mb-4 h-6 w-32" />
          <Bone className="mb-4 h-4 w-full" />
          <div className="grid gap-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Bone key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
        <TableBones rows={5} />
      </div>
      <div className="mb-8 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="h-32 rounded-xl bg-soft" />
        ))}
      </div>
      <TableBones rows={5} />
    </Loading>
  );
}

export function BuilderSkeleton() {
  return (
    <Loading label="Loading the list builder">
      {/* Columns switch on the builder's own width, like the real page. */}
      <div className="@container">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 @4xl:grid-cols-[22.5rem_minmax(0,1fr)]">
          <div className="grid min-w-0 content-start gap-6 rounded-2xl border border-line bg-paper p-4 sm:p-6">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i}>
                <Bone className="mb-3 h-4 w-24" />
                <Bone className="h-9 w-full" />
              </div>
            ))}
          </div>
          <div className="@container grid min-w-0 content-start gap-8">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 @xl:grid-cols-[18rem_minmax(0,1fr)] @xl:gap-8">
              <div className="relative mx-auto h-72 w-full max-w-72 overflow-hidden rounded-3xl border border-line bg-paper pt-16 @xl:mx-0">
                <HangerTop />
                <div className="h-28 bg-soft" />
              </div>
              <div className="grid content-start gap-3 @xl:pt-16">
                <Bone className="h-6 w-40" />
                <Bone className="h-4 w-64 max-w-full" />
                <Bone className="h-9 w-full" />
                <Bone className="h-9 w-28" />
              </div>
            </div>
            <TableBones rows={6} />
          </div>
        </div>
      </div>
    </Loading>
  );
}

// Matches the list detail: one walk sheet with figures, the walk strip, the volunteer stub, the table.
export function ListDetailSkeleton() {
  return (
    <Loading label="Loading the list">
      <Bone className="mb-4 h-4 w-12" />
      <div className="grid gap-6 rounded-2xl border border-line bg-paper p-6">
        <div>
          <Bone className="mb-3 h-9 w-80 max-w-full" />
          <Bone className="mb-2 h-5 w-64 max-w-full" />
          <Bone className="h-4 w-56 max-w-full" />
        </div>
        <Bone className="h-8 w-72 max-w-full" />
        <Bone className="h-6 w-full" />
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-line pt-6">
          <Bone className="h-5 w-40" />
          <Bone className="h-9 w-64" />
        </div>
        <Bone className="h-9 w-56" />
        <TableBones rows={6} />
      </div>
    </Loading>
  );
}

// Matches the lists index: one sheet with a row per list.
export function ListsSkeleton() {
  return (
    <Loading label="Loading lists">
      <div className="rounded-2xl border border-line bg-paper">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="grid gap-4 border-t border-line-soft p-6 first:border-t-0 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_14rem] md:items-center">
            <div>
              <Bone className="mb-2 h-6 w-56 max-w-full" />
              <Bone className="h-4 w-40" />
            </div>
            <Bone className="h-8 w-32" />
            <Bone className="h-12 w-20" />
            <Bone className="h-9 w-full" />
          </div>
        ))}
      </div>
    </Loading>
  );
}


// Matches the canvass view: progress, a status line, then the voter's hanger.
export function CanvassSkeleton() {
  return (
    <Loading label="Loading the next voter">
      <div className="mx-auto max-w-md">
        <div className="flex h-11 items-center justify-between gap-4">
          <Bone className="h-4 w-32" />
          <Bone className="h-5 w-28" />
        </div>
        <Bone className="my-1 h-6 w-56" />
        <Bone className="mt-2 mb-3 h-1.5 w-full" />
        <div className="h-10">
          <Bone className="h-5 w-64" />
        </div>
        <div className="relative mt-3 overflow-hidden rounded-3xl border border-line bg-paper pt-16">
          <HangerTop />
          <div className="h-[124px] bg-indigo" />
          <div className="grid gap-4 px-6 pt-4">
            <Bone className="h-5 w-48" />
            <Bone className="h-[50px] w-full" />
            <Bone className="h-[50px] w-full" />
          </div>
          <div className="mt-6 h-9 bg-orange" />
          <div className="grid gap-6 px-6 pt-4 pb-6">
            <div>
              <Bone className="mb-2 h-5 w-28" />
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Bone key={i} className="h-18" />
                ))}
              </div>
            </div>
            <Bone className="h-[50px] w-full" />
          </div>
        </div>
      </div>
    </Loading>
  );
}

// Matches a volunteer's "my lists" page: a rack of hangers.
export function ListRackSkeleton() {
  return (
    <Loading label="Loading the volunteer's lists">
      <Bone className="mb-3 h-4 w-24" />
      <Bone className="mb-8 h-9 w-72 max-w-full" />
      <div className="grid gap-6 sm:grid-cols-[repeat(auto-fill,minmax(0,20rem))]">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="relative h-[400px] overflow-hidden rounded-3xl border border-line bg-paper pt-16">
            <HangerTop />
            <div className="h-24 bg-indigo" />
            <div className="h-9 bg-orange" />
            <div className="grid gap-3 p-6">
              <Bone className="h-10 w-24" />
              <Bone className="h-1.5 w-full" />
              <Bone className="h-11 w-full" />
            </div>
          </div>
        ))}
      </div>
    </Loading>
  );
}
