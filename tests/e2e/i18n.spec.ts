import { test, expect } from "@playwright/test";

/**
 * Locale switching FR <-> EN on the public landing page.
 *
 * Mechanism (src/shared/components/language/LanguageToggle.tsx +
 * src/i18n/request.ts): the toggle sets a NEXT_LOCALE cookie and reloads; the
 * server reads that cookie to pick messages/{locale}.json. The hero headline
 * differs per locale:
 *   - fr: "Votre temps,"
 *   - en: "Your time,"
 *
 * This needs only a running app (no auth, no DB). It is active (not fixme).
 *
 * The LanguageToggle is hidden below the `sm` breakpoint (hidden sm:flex), so
 * this scenario is scoped to the desktop "chromium" project; under the narrow
 * "mobile" project the control isn't rendered, so we cookie-drive the locale.
 */
test.describe("i18n", () => {
  test("switches locale FR <-> EN and the hero text changes", async ({
    page,
  }, testInfo) => {
    // Start from a known locale by seeding the cookie, then load the page.
    await page.context().addCookies([
      {
        name: "NEXT_LOCALE",
        value: "fr",
        url: "http://localhost:3000",
      },
    ]);
    await page.goto("/");

    const heroFr = page
      .getByRole("heading", { level: 1 })
      .filter({ hasText: /votre temps/i });
    const heroEn = page
      .getByRole("heading", { level: 1 })
      .filter({ hasText: /your time/i });

    await expect(heroFr).toBeVisible();

    if (testInfo.project.name === "mobile") {
      // The toggle is hidden on small viewports; drive the locale via cookie.
      await page.context().addCookies([
        { name: "NEXT_LOCALE", value: "en", url: "http://localhost:3000" },
      ]);
      await page.reload();
    } else {
      // Desktop: use the actual UI control (Globe button showing "FR").
      await page
        .getByRole("button", { name: /switch to english|fr/i })
        .first()
        .click();
      // The toggle reloads the page; wait for EN content.
    }

    await expect(heroEn).toBeVisible();
    await expect(heroFr).toHaveCount(0);
  });
});
