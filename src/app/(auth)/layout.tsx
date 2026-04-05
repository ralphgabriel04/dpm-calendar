import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/config";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  return <>{children}</>;
}
