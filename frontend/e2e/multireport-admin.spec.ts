import { test, expect } from '@playwright/test';

// Multi-report switching (RNFM / ESG Index / UPC / ISSB (AU) / TCFD (UK) / HRS)
// and admin structure editing.

test('report switcher offers all parallel reports', async ({ page }) => {
  await page.goto('/');
  const select = page.locator('select').first();
  await expect(select).toBeVisible();
  const optionText = (await select.locator('option').allTextContents()).join(' | ');
  for (const name of ['RNFM', 'ESG Index', 'UPC', 'ISSB (AU)', 'TCFD (UK)']) {
    expect(optionText, `report option "${name}" present`).toContain(name);
  }
});

test('switching to a parallel report scopes the current tab to that report', async ({ page }) => {
  await page.goto('/editor');
  const select = page.locator('select').first();
  // Switching reports now stays on the current tab (report-scoped views resolve
  // by the active report) rather than force-routing to a standalone /report page.
  await select.selectOption('upc');
  await expect(page).toHaveURL(/\/editor$/);
  await expect(page.locator('.app-content').getByText(/Update on Public Commitments/).first()).toBeVisible();
});

test('parallel report scopes the Dashboard tab too', async ({ page }) => {
  await page.goto('/dashboard');
  await page.locator('select').first().selectOption('upc');
  // The Dashboard now shows the selected report's scoped header, not RNFM data.
  await expect(page.locator('.app-content').getByText(/UPC · Dashboard/).first()).toBeVisible();
});

test('ASRS report shows the ISSB -> AASB mapping', async ({ page }) => {
  await page.goto('/editor');
  await page.locator('select').first().selectOption('asrs');
  await expect(page.locator('.app-content').getByText(/ISSB.*AASB|AASB.*mapping/i).first()).toBeVisible();
});

test('report-scoped tabs all follow the selected parallel report', async ({ page }) => {
  await page.goto('/');
  await page.locator('select').first().selectOption('esg-index');
  // Each report-scoped tab now shows the ESG Index scoped header rather than RNFM data.
  for (const [path, re] of [
    ['/structure', /ESG Index · Section Structure/],
    // Compliance & consistency now render inside the merged "Analysis" view; the
    // report context shows in the Analysis header (the scoped child title is hidden).
    ['/compliance', /ESG Index · Analysis · Compliance/],
    ['/consistency', /ESG Index · Analysis · Consistency Check/],
    ['/audit', /ESG Index · Audit Trail/],
  ] as const) {
    await page.goto(path);
    await expect(page.locator('.app-content').getByText(re).first()).toBeVisible();
  }
  // Switching back to RNFM restores the full authoring studio on the same tabs.
  await page.locator('select').first().selectOption('rnfm');
  await page.goto('/audit');
  await expect(page.locator('.app-content').getByText(/ESG Index · Audit Trail/)).toHaveCount(0);
});

test('admin (jordanavery) can edit the section structure', async ({ page }) => {
  // The e2e auth bypass logs in as jordanavery, who is a structure admin.
  await page.goto('/structure');
  // Admin does NOT see the permission-denied card ("does not have this permission").
  await expect(page.getByText(/does not have this permission/i)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Commit version' })).toBeVisible();
  // Tree edit controls exist: add sub-topic / add subsection / remove / publish.
  await expect(page.getByRole('button', { name: '＋ sub-topic' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: '＋ subsection' }).first()).toBeVisible();
  await expect(page.locator('button[title="Remove"]').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Publish to Report Editor' })).toBeVisible();
});
