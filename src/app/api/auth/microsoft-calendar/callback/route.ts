import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth/config";
import { db } from "@/server/db/client";
import { exchangeCodeForTokens, listCalendars, getUserEmail } from "@/lib/microsoft/calendar";

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
    const errorDescription = searchParams.get("error_description");

    if (error) {
      console.error("Microsoft OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        new URL("/settings?error=microsoft_auth_failed", request.url)
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

    // Get user's email
    const email = await getUserEmail(tokens.accessToken);

    // Get user's calendars
    const calendars = await listCalendars(tokens.accessToken);

    // Check if account already exists
    const existingAccount = await db.calendarAccount.findFirst({
      where: {
        userId: session.user.id,
        provider: "MICROSOFT",
        email,
      },
    });

    if (existingAccount) {
      // Update existing account
      await db.calendarAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken || existingAccount.refreshToken,
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
          provider: "MICROSOFT",
          email,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiryDate
            ? new Date(tokens.expiryDate)
            : null,
          isActive: true,
        },
      });

      // Create local calendars for each Microsoft calendar
      for (const msCal of calendars) {
        await db.calendar.create({
          data: {
            userId: session.user.id,
            calendarAccountId: newAccount.id,
            externalId: msCal.id,
            name: msCal.name,
            color: msCal.color || "#0078D4",
            provider: "MICROSOFT",
            isDefault: msCal.isDefaultCalendar || false,
            canEdit: msCal.canEdit || false,
          },
        });
      }
    }

    // Redirect to settings with success
    return NextResponse.redirect(
      new URL("/settings?success=microsoft_connected", request.url)
    );
  } catch (error) {
    console.error("Microsoft Calendar callback error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=microsoft_callback_failed", request.url)
    );
  }
}
