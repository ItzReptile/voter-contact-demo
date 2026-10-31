import Link from "next/link";
import { linkClass } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-line bg-surface p-6">
      <h1 className="text-lg font-semibold">Not found</h1>
      <p className="mt-1 text-sm text-ink-2">
        That page doesn&apos;t exist.{" "}
        <Link href="/" className={linkClass}>
          Back to the dashboard
        </Link>
      </p>
    </div>
  );
}
