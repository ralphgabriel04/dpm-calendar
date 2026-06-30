import { test, expect, type BrowserContext } from "@playwright/test";
import { login, openNewTaskModal, selectors, uniqueSuffix } from "./helpers";

/**
 * Security / tenant-isolation: a task created by user A must NOT be visible or
 * accessible to user B.
 *
 * This is the most important security guarantee to encode. It uses two isolated
 * browser contexts (separate cookie jars) so the two demo users don't share a
 * session.
 *
 * REQUIREMENTS to run green:
 *   - Two demo accounts (the demo provider find-or-creates them by email), and
 *   - A database so tasks persist and the per-user tRPC queries scope by owner.
 *
 * Marked fixme until that seeded, OAuth-free environment exists (see docs/E2E.md).
 *
 * Implementation note: the app does not expose a stable per-task deep-link
 * route, so cross-user access is verified by absence in user B's task list
 * (the tRPC `task.list` query is scoped to the authenticated user). If/when a
 * `/tasks/:id` route is added, extend this to assert a 403/404 by id too.
 */
test.describe("isolation", () => {
  test.fixme(
    "user B cannot see a task created by user A",
    async ({ browser }) => {
      // requires two seeded demo accounts + a database
      let contextA: BrowserContext | undefined;
      let contextB: BrowserContext | undefined;
      try {
        contextA = await browser.newContext();
        contextB = await browser.newContext();

        const pageA = await contextA.newPage();
        const pageB = await contextB.newPage();

        const secret = `secret-task-${uniqueSuffix()}`;

        // User A logs in and creates a private task.
        await login(pageA, `e2e-userA-${uniqueSuffix()}@example.com`);
        await pageA.goto("/tasks");
        await openNewTaskModal(pageA);
        await pageA
          .getByPlaceholder(selectors.tasks.titleInput)
          .fill(secret);
        await pageA
          .getByRole("button", { name: selectors.tasks.create })
          .click();
        await expect(pageA.getByText(secret, { exact: false })).toBeVisible();

        // User B logs in (different account) and must NOT see A's task.
        await login(pageB, `e2e-userB-${uniqueSuffix()}@example.com`);
        await pageB.goto("/tasks");
        await expect(
          pageB.getByRole("heading", { name: selectors.tasks.header }),
        ).toBeVisible();
        await expect(pageB.getByText(secret, { exact: false })).toHaveCount(0);
      } finally {
        await contextA?.close();
        await contextB?.close();
      }
    },
  );
});
