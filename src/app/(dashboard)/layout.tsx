import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/config";
import { db } from "@/infrastructure/db/client";
import { DashboardClient } from "@/shared/components/layout";

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

  return <DashboardClient>{children}</DashboardClient>;
}
