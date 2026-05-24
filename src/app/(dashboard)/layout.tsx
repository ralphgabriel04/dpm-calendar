import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/infrastructure/auth/config";
import { db } from "@/infrastructure/db/client";
import { DashboardClient } from "@/shared/components/layout";

const ONBOARDING_COOKIE = "dpm_onboarding_completed";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check cookie first to avoid DB roundtrip on every navigation
  const cookieStore = await cookies();
  const onboardingCookie = cookieStore.get(ONBOARDING_COOKIE);

  // If cookie exists and matches user, skip DB call
  if (onboardingCookie?.value === session.user.id) {
    return <DashboardClient>{children}</DashboardClient>;
  }

  // Cookie missing or stale - check DB
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true },
  });

  if (!user?.onboardingCompleted) {
    redirect("/onboarding");
  }

  // Set cookie for future navigations (valid for 7 days)
  // This happens via Set-Cookie header in the response
  cookieStore.set(ONBOARDING_COOKIE, session.user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return <DashboardClient>{children}</DashboardClient>;
}
