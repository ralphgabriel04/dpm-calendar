import { test, expect } from "@playwright/test";
import { login, uniqueSuffix } from "./helpers";

/**
 * Authentication flow via the dev "Demo Account" credentials provider.
 *
 * HOW IT WORKS:
 *   1. Navigate to /login.
 *   2. Fill the email field (#email) and submit "Continuer avec l'email".
 *   3. NextAuth's Credentials("Demo Account") provider find-or-creates a user
 *      and signs in (no password), redirecting to /calendar.
 *
 * REQUIREMENTS to run green:
 *   - NODE_ENV !== "production" AND no OAuth provider configured, so the demo
 *     credentials provider is registered (see src/infrastructure/auth/config.ts).
 *   - A reachable database (the provider creates the user + default calendar).
 *
 * Marked fixme until that seeded, OAuth-free dev environment exists.
 */
test.describe("auth", () => {
  test.fixme(
    "logs in via the demo credentials provider and lands in the app",
    async ({ page }) => {
      // requires NODE_ENV!=production + no OAuth configured (demo provider)
      // and a running database.
      await login(page, `e2e-auth-${uniqueSuffix()}@example.com`);

      // We should be authenticated and inside a dashboard route.
      await expect(page).toHaveURL(/\/(calendar|home|dashboard)/);

      // The public landing "Se connecter" CTA should no longer be the page;
      // assert some authenticated chrome is present instead.
      await expect(
        page.getByRole("navigation").first(),
      ).toBeVisible();
    },
  );

  test("unauthenticated access to a protected route redirects to /login", async ({
    page,
  }) => {
    // middleware.ts redirects protected prefixes to /login when no session
    // cookie is present — this needs only a running app (no DB, no auth).
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/login(\?|$)/);
    await expect(
      page.getByRole("heading", { name: /bienvenue/i }),
    ).toBeVisible();
  });
});
