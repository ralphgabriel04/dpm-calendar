import { test, expect } from "@playwright/test";
import { login, openNewTaskModal, selectors, uniqueSuffix } from "./helpers";

/**
 * Task CRUD flow: create a task, assert it appears, then edit it.
 *
 * REQUIREMENTS: authenticated session (demo provider) + a database, because
 * tasks are persisted via the tRPC `task.create` / `task.update` mutations.
 * Marked fixme until that seeded environment exists (see docs/E2E.md).
 */
test.describe("tasks", () => {
  test.fixme("creates a task and it appears in the list", async ({ page }) => {
    // requires authenticated demo session + seeded DB (tRPC task.create)
    await login(page);
    await page.goto("/tasks");
    await expect(
      page.getByRole("heading", { name: selectors.tasks.header }),
    ).toBeVisible();

    const title = `E2E task ${uniqueSuffix()}`;

    await openNewTaskModal(page);
    await page.getByPlaceholder(selectors.tasks.titleInput).fill(title);
    await page.getByRole("button", { name: selectors.tasks.create }).click();

    // The new task should render somewhere in the task views.
    await expect(page.getByText(title, { exact: false })).toBeVisible();
  });

  test.fixme("edits an existing task title", async ({ page }) => {
    // requires authenticated demo session + seeded DB (tRPC task.update)
    await login(page);
    await page.goto("/tasks");

    const title = `E2E edit ${uniqueSuffix()}`;
    const editedTitle = `${title} (edited)`;

    // Create one first.
    await openNewTaskModal(page);
    await page.getByPlaceholder(selectors.tasks.titleInput).fill(title);
    await page.getByRole("button", { name: selectors.tasks.create }).click();
    const taskRow = page.getByText(title, { exact: false });
    await expect(taskRow).toBeVisible();

    // Open it for editing. The list/kanban rows expose an edit affordance;
    // clicking the row title opens the detail/edit flow.
    await taskRow.click();

    // The edit modal reuses the same title input; update and save.
    const titleInput = page.getByPlaceholder(selectors.tasks.titleInput);
    await titleInput.fill(editedTitle);
    await page.getByRole("button", { name: selectors.tasks.save }).click();

    await expect(page.getByText(editedTitle, { exact: false })).toBeVisible();
  });
});
