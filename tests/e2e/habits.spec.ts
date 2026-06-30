import { test, expect } from "@playwright/test";
import { login } from "./helpers";

/**
 * Habit completion flow: check a habit for today, assert the streak/indicator
 * updates, then uncheck and assert it reverts.
 *
 * REQUIREMENTS: authenticated session + a database with at least one seeded
 * habit for the user (the page renders habits from tRPC `habit.getTodayStatus`,
 * and the toggle calls `habit.log`). Marked fixme until that seeded data exists
 * (see docs/E2E.md).
 *
 * Selector notes (src/features/habits/components/HabitCard.tsx):
 *   - Each habit is a card; the completion control is the leading round
 *     <button>. When complete it shows a Check icon and turns green.
 *   - The current streak renders as a Flame icon + number when streak > 0.
 */
test.describe("habits", () => {
  test.fixme(
    "checking a habit updates the streak, unchecking reverts it",
    async ({ page }) => {
      // requires authenticated demo session + a seeded habit in the DB
      await login(page);
      await page.goto("/habits");
      await expect(
        page.getByRole("heading", { name: /habitudes/i }),
      ).toBeVisible();

      // The first habit card. Scope interactions to it.
      const firstCard = page
        .locator("div.group")
        .filter({ has: page.getByRole("button") })
        .first();
      await expect(firstCard).toBeVisible();

      // The leading round button toggles today's completion.
      const toggle = firstCard.getByRole("button").first();

      // Read the "completed today" stat from the header card before toggling.
      const completedStat = page
        .getByText(/complétées aujourd'hui/i)
        .locator("xpath=preceding-sibling::p[1]");
      const before = (await completedStat.textContent())?.trim() ?? "";

      // Check it.
      await toggle.click();
      await expect(completedStat).not.toHaveText(before);

      // Uncheck it — the count should revert to the original value.
      await toggle.click();
      await expect(completedStat).toHaveText(before);
    },
  );
});
