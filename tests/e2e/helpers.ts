import { expect, type Page } from "@playwright/test";

/**
 * Shared helpers and resilient selectors for the E2E suite.
 *
 * Prefer role/text based selectors so the specs survive markup refactors.
 */

/** Generate a reasonably-unique string for test data (task titles, emails, …). */
export function uniqueSuffix(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/**
 * Log in via the dev "Demo Account" credentials provider.
 *
 * The demo provider (see src/infrastructure/auth/config.ts) is ONLY registered
 * when:
 *   - NODE_ENV !== "production", AND
 *   - no OAuth provider (Google/Microsoft/GitHub/Apple/SSO) is configured.
 * It find-or-creates a user from the submitted email with no password check,
 * which is exactly what we want for E2E. When OAuth env vars are present the
 * email form on /login still posts to the credentials provider, but no such
 * provider exists, so login will fail — that's why auth-dependent specs are
 * guarded/fixme until a seeded test environment exists (see docs/E2E.md).
 *
 * @param page  Playwright page.
 * @param email Demo account email. Reusing the same email reuses the same user.
 */
export async function login(
  page: Page,
  email = "e2e-demo@example.com",
): Promise<void> {
  await page.goto("/login");

  // The login page renders an email field (#email) and a submit button
  // labelled "Continuer avec l'email".
  const emailInput = page.getByLabel(/adresse email/i).or(page.locator("#email"));
  await emailInput.fill(email);

  await page
    .getByRole("button", { name: /continuer avec l'email/i })
    .click();

  // After a successful credentials sign-in the app redirects to /calendar.
  await page.waitForURL(/\/(calendar|home|dashboard)(\/|$|\?)/, {
    timeout: 15_000,
  });
}

/** Open the "New task" modal from the Tasks page header. */
export async function openNewTaskModal(page: Page): Promise<void> {
  // Button label is "Nouvelle tâche" on desktop; on small screens it's an
  // icon-only button, so match by accessible name OR the leading title text.
  await page.getByRole("button", { name: /nouvelle tâche/i }).first().click();
  // The modal title is also "Nouvelle tâche".
  await expect(
    page.getByRole("heading", { name: /nouvelle tâche/i }),
  ).toBeVisible();
}

/** Selectors grouped by page for readability. */
export const selectors = {
  landing: {
    heroHeadingFr: /votre temps/i,
    heroHeadingEn: /your time/i,
  },
  login: {
    heading: /bienvenue/i,
    emailInput: "#email",
    submit: /continuer avec l'email/i,
  },
  tasks: {
    header: /tâches/i,
    newTaskButton: /nouvelle tâche/i,
    titleInput: /titre de la tâche/i, // placeholder
    create: /^créer$/i,
    save: /enregistrer/i,
  },
  habits: {
    header: /habitudes/i,
    newHabitButton: /nouvelle habitude/i,
  },
} as const;
