import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/config";
import { db } from "@/infrastructure/db/client";
import { exchangeCodeForTokens, listCalendars } from "@/lib/google/calendar";
import { encryptToken, encryptOptionalToken } from "@/lib/crypto";

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Get the authorization code from the URL
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        new URL("/settings?error=google_auth_failed", request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings?error=no_code", request.url)
      );
    }

    // Exchange the code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.accessToken) {
      return NextResponse.redirect(
        new URL("/settings?error=no_access_token", request.url)
      );
    }

    // Get user's email from Google calendars (the primary calendar has the user's email)
    const calendars = await listCalendars(tokens.accessToken);
    const primaryCalendar = calendars.find((c) => c.primary);
    const email = primaryCalendar?.id || "unknown@gmail.com";

    // Check if account already exists
    const existingAccount = await db.calendarAccount.findFirst({
      where: {
        userId: session.user.id,
        provider: "GOOGLE",
        email,
      },
    });

    if (existingAccount) {
      // Update existing account
      await db.calendarAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: encryptToken(tokens.accessToken),
          refreshToken: tokens.refreshToken
            ? encryptToken(tokens.refreshToken)
            : existingAccount.refreshToken,
          expiresAt: tokens.expiryDate
            ? new Date(tokens.expiryDate)
            : null,
          isActive: true,
          lastError: null,
        },
      });
    } else {
      // Create new account
      const newAccount = await db.calendarAccount.create({
        data: {
          userId: session.user.id,
          provider: "GOOGLE",
          email,
          accessToken: encryptToken(tokens.accessToken),
          refreshToken: encryptOptionalToken(tokens.refreshToken),
          expiresAt: tokens.expiryDate
            ? new Date(tokens.expiryDate)
            : null,
          isActive: true,
        },
      });

      // Create local calendars for each Google calendar
      for (const googleCal of calendars) {
        // Skip calendars that are just subscriptions/holidays
        if (
          googleCal.accessRole === "reader" ||
          googleCal.id.includes("holiday")
        ) {
          continue;
        }

        await db.calendar.create({
          data: {
            userId: session.user.id,
            calendarAccountId: newAccount.id,
            externalId: googleCal.id,
            name: googleCal.summary,
            description: googleCal.description,
            color: googleCal.backgroundColor || "#3b82f6",
            provider: "GOOGLE",
            isDefault: googleCal.primary || false,
            canEdit: googleCal.accessRole === "owner" || googleCal.accessRole === "writer",
          },
        });
      }
    }

    // Redirect to settings with success
    return NextResponse.redirect(
      new URL("/settings?success=google_connected", request.url)
    );
  } catch (error) {
    console.error("Google Calendar callback error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=google_callback_failed", request.url)
    );
  }
}
