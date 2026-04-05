import { NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/config";
import { getAuthUrl } from "@/lib/google/calendar";

export async function GET() {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate the Google OAuth URL
    const authUrl = getAuthUrl();

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Google Calendar auth error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Google Calendar authentication" },
      { status: 500 }
    );
  }
}
