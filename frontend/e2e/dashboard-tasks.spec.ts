import { test, expect } from '@playwright/test';

// "My Open Tasks" role switcher (2026-07-15): the dashboard user can preview the
// open-task queue for each role. Tasks are derived per role AND validated
// against ROLE_PERMISSIONS so the queue never surfaces an action the role can't
// perform. Verified behaviours:
//  - Input Provider sees drafting tasks; Owner sees sign-off tasks.
//  - Guest is read-only → no actionable tasks (empty by permission).

async function openTasksCard(page: import('@playwright/test').Page) {
  // The RNFM authoring dashboard (with the "My Open Tasks" role switcher) now
  // lives at /dashboard; "/" is the cross-report Home landing.
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /Open Tasks/ })).toBeVisible();
}

test('the tasks card has a "View tasks as" role switch', async ({ page }) => {
  await openTasksCard(page);
  const select = page.locator('select[title*="Preview the open-task queue"]');
  await expect(select).toBeVisible();
  // All roles are selectable.
  for (const opt of ['input_provider', 'owner', 'editor', 'admin', 'guest']) {
    await expect(select.locator(`option[value="${opt}"]`)).toHaveCount(1);
  }
});

test('Input Provider role shows drafting tasks', async ({ page }) => {
  await openTasksCard(page);
  await page.locator('select[title*="Preview the open-task queue"]').selectOption('input_provider');
  // Input Provider drafts → at least one "Draft & submit for review" task.
  await expect(page.getByText(/Draft & submit for review/).first()).toBeVisible();
});

test('Owner role shows Owner sign-off tasks, not drafting tasks', async ({ page }) => {
  await openTasksCard(page);
  await page.locator('select[title*="Preview the open-task queue"]').selectOption('owner');
  await expect(page.getByText(/Review & Owner sign-off/).first()).toBeVisible();
  // An Owner is not an Input Provider — no drafting tasks in the Owner queue.
  await expect(page.getByText(/Draft & submit for review/)).toHaveCount(0);
});

test('Guest role has no actionable tasks (read-only, validated by permissions)', async ({ page }) => {
  await openTasksCard(page);
  await page.locator('select[title*="Preview the open-task queue"]').selectOption('guest');
  await expect(page.getByText(/Guest is read-only/i)).toBeVisible();
  await expect(page.getByText(/Draft & submit for review/)).toHaveCount(0);
  await expect(page.getByText(/Review & Owner sign-off/)).toHaveCount(0);
});

test('the role switch is in the page header (matches the editor)', async ({ page }) => {
  await openTasksCard(page);
  // The switch sits inside the .view-header alongside the title + New Report Cycle.
  await expect(page.locator('.view-header select[title*="Preview the open-task queue"]')).toBeVisible();
});

test('clicking an open task opens that exact subsection in the editor', async ({ page }) => {
  await openTasksCard(page);
  // Read the first task's ref (e.g. "7.2.7") and title, then click it.
  const firstTask = page.locator('.card').filter({ hasText: /Open Tasks/ }).locator('button').first();
  const ref = (await firstTask.locator('span').first().textContent())?.trim() ?? '';
  expect(ref).toMatch(/^\d+(\.\d+)*$/);
  await firstTask.click();
  // Lands on the editor and the selected-subsection heading matches the task ref
  // — i.e. it opened the RIGHT section, not just the editor's default section.
  await expect(page).toHaveURL(/\/editor/);
  await expect(page.locator('.app-content h2').filter({ hasText: ref }).first()).toBeVisible();
});
