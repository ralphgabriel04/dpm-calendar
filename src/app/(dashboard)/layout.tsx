import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { db } from "@/server/db/client";
import { Sidebar, SidebarTrigger } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if onboarding is completed
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true },
  });

  if (!user?.onboardingCompleted) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:hidden">
          <SidebarTrigger />
          <h1 className="font-semibold text-sm">DPM Calendar</h1>
        </header>

        {/* Main content - add bottom padding for mobile nav */}
        <main className="flex-1 overflow-auto pb-16 lg:pb-0">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
