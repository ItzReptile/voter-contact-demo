import { SignOut } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Suspense } from "react";
import { LogoMark } from "@/components/logo";
import { ghostButtonClass } from "@/components/ui";

// Volunteer mode: the canvass view on its own, phone first, without the organizer's header and
// footer. A slim bar says where you are and has one way back: this list's page in the organizer app.
export default function VolunteerLayout({ children, params }: LayoutProps<"/lists/[id]/canvass">) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line-soft bg-paper">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between gap-4 px-4">
          <p className="flex items-center gap-2 title-4">
            <LogoMark className="h-6 w-4 shrink-0" />
            Volunteer mode
          </p>
          {/* The list id comes from the URL, known only at request time; until then the link goes to all lists. */}
          <Suspense fallback={<OrganizerLink href="/lists" />}>
            <ListOrganizerLink params={params} />
          </Suspense>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-md px-4 pt-4 pb-12 outline-none">
        {children}
      </main>
    </div>
  );
}

async function ListOrganizerLink({ params }: { params: Promise<{ id: string }> }) {
  return <OrganizerLink href={`/lists/${(await params).id}`} />;
}

function OrganizerLink({ href }: { href: string }) {
  return (
    <Link href={href} className={`${ghostButtonClass} -mr-2 min-h-11`}>
      <SignOut size={16} aria-hidden />
      Organizer view
    </Link>
  );
}
