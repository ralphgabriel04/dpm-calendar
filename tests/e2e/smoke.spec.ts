import { test, expect } from "@playwright/test";
import { selectors } from "./helpers";

/**
 * Smoke tests — no auth or DB writes required.
 *
 * These can pass against any running instance of the app (the landing page and
 * /login are public). They assert real, known content from the source:
 *   - Landing hero <h1> contains "Votre temps," (fr) / "Your time," (en).
 *   - /login renders the "Bienvenue !" heading and an email field.
 */
test.describe("smoke", () => {
  test("GET / returns 200 and renders the landing page", async ({ page }) => {
    const response = await page.goto("/");
    expect(response, "navigation response").not.toBeNull();
    expect(response!.status()).toBe(200);

    // The hero headline is locale-dependent; accept either default locale.
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .filter({
          hasText: new RegExp(
            `${selectors.landing.heroHeadingFr.source}|${selectors.landing.heroHeadingEn.source}`,
            "i",
          ),
        }),
    ).toBeVisible();

    // There is a clear path into the app.
    await expect(
      page.getByRole("link", { name: /se connecter|sign in/i }).first(),
    ).toBeVisible();
  });

  test("GET /login shows the login page", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response!.status()).toBe(200);

    await expect(
      page.getByRole("heading", { name: selectors.login.heading }),
    ).toBeVisible();

    // Email login field + submit button are present.
    await expect(page.locator(selectors.login.emailInput)).toBeVisible();
    await expect(
      page.getByRole("button", { name: selectors.login.submit }),
    ).toBeVisible();
  });
});
