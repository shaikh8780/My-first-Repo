import { test, expect } from '@playwright/test';

// Compliance: organized BY STANDARD, datapoint-level, with the added human-rights
// standards (UK/CA/AU Modern Slavery + Norwegian Transparency), and bi-directional
// datapoint <-> section navigation.

test('three compliance view modes are available', async ({ page }) => {
  await page.goto('/compliance');
  for (const label of ['By Standard', 'Gap Analysis', 'Disclosure Checklist']) {
    await expect(page.getByRole('button', { name: label })).toBeVisible();
  }
});

test('by-standard framework filters include ESRS, MSA and NTA', async ({ page }) => {
  await page.goto('/compliance');
  await page.getByRole('button', { name: 'By Standard' }).click();
  // Framework filter buttons: all / ESRS / GRI / TCFD / ISSB / MSA / NTA.
  for (const fw of ['ESRS', 'GRI', 'TCFD', 'ISSB', 'MSA', 'NTA']) {
    await expect(page.getByRole('button', { name: fw, exact: true })).toBeVisible();
  }
});

test('datapoint-level granularity: standard groups report datapoint counts', async ({ page }) => {
  await page.goto('/compliance');
  await page.getByRole('button', { name: 'By Standard' }).click();
  await expect(page.getByText(/datapoints/i).first()).toBeVisible();
});

test('Run Scan executes and completes', async ({ page }) => {
  await page.goto('/compliance');
  const scan = page.getByRole('button', { name: /Run Scan/ });
  await expect(scan).toBeVisible();
  await scan.click();
  // The button is disabled while scanning, then re-enables when done.
  await expect(page.getByRole('button', { name: /Run Scan/ })).toBeEnabled({ timeout: 20_000 });
});

test('gap analysis: a datapoint row expands to show the sections addressing it', async ({ page }) => {
  await page.goto('/compliance');
  await page.getByRole('button', { name: 'Gap Analysis' }).click();
  // Click the first data row; a covered/partial row reveals "Addressed in section(s)".
  const firstRow = page.locator('table tbody tr').first();
  await firstRow.click();
  await expect(page.getByText(/Addressed in section\(s\)|Not yet addressed/i).first()).toBeVisible();
});

// #10 (Adrian 2026-07-15): smoother editor↔analysis navigation — the "addressed
// in section" pills are clickable and jump to that section in the editor.
test('a covered datapoint\'s section pill opens that section in the editor', async ({ page }) => {
  await page.goto('/compliance');
  await page.getByRole('button', { name: 'Gap Analysis' }).click();
  // Filter to covered so the first row has section pills.
  await page.getByRole('button', { name: 'Covered', exact: true }).click();
  await page.locator('table tbody tr').first().click();
  const pill = page.locator('.row-details button', { hasText: /↗/ }).first();
  await expect(pill).toBeVisible();
  await pill.click();
  await expect(page).toHaveURL(/\/editor/);
  await expect(page.locator('.app-content h2').first()).toBeVisible();
});

test('gap analysis: a partial DR shows a "why partially covered" rationale', async ({ page }) => {
  await page.goto('/compliance');
  await page.getByRole('button', { name: 'Gap Analysis' }).click();
  // Filter to partial so the first row is a partial DR.
  await page.getByRole('button', { name: 'Partial', exact: true }).click();
  await page.locator('table tbody tr').first().click();
  await expect(page.getByText(/Why partially covered/i)).toBeVisible();
});

test('gap analysis: a missing DR shows why + a "should this be added?" recommendation', async ({ page }) => {
  await page.goto('/compliance');
  await page.getByRole('button', { name: 'Gap Analysis' }).click();
  await page.getByRole('button', { name: 'Missing', exact: true }).click();
  await page.locator('table tbody tr').first().click();
  await expect(page.getByText(/Why missing/i)).toBeVisible();
  await expect(page.getByText(/Should this be added\?/i)).toBeVisible();
});

test('GRI / TCFD / MSA / NTA DR ids are now clickable with authored requirement text', async ({ page }) => {
  await page.goto('/compliance');
  await page.getByRole('button', { name: 'By Standard' }).click();
  // Filter to GRI, expand the first GRI standard group, then click a GRI DR id.
  await page.getByRole('button', { name: 'GRI', exact: true }).click();
  // The group header carries a framework badge; expand the first GRI group.
  await page.locator('button', { has: page.locator('.framework-badge', { hasText: 'GRI' }) }).first().click();
  const griLink = page.locator('table button', { hasText: /^GRI-/ }).first();
  await expect(griLink).toBeVisible();
  await griLink.click();
  // The popup shows the authored source provenance note.
  await expect(page.getByText(/Source —/i)).toBeVisible();
  await expect(page.getByText(/public GRI Standards/i)).toBeVisible();
});

test('checklist: clicking an ESRS/ISSB DR id shows the verbatim standard text', async ({ page }) => {
  await page.goto('/compliance');
  await page.getByRole('button', { name: 'Disclosure Checklist' }).click();

  // The Requirement column is verbatim; DR ids with loaded standard text are
  // clickable and open the requirement popup (13 Jul 2026 feedback #11).
  const drLink = page.locator('table button', { hasText: /^ESRS|^ISSB/ }).first();
  await expect(drLink).toBeVisible();
  await drLink.click();

  // The popup shows verbatim text with a paragraph reference.
  await expect(page.getByText(/Verbatim requirement text from the standard/i)).toBeVisible();
  await expect(page.locator('.modal-content')).toBeVisible();
  // Close it.
  await page.locator('.modal-content').getByRole('button', { name: '✕' }).click();
  await expect(page.getByText(/Verbatim requirement text from the standard/i)).toHaveCount(0);
});
