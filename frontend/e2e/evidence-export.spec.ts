import { test, expect } from '@playwright/test';

// #5 per-paragraph/source evidence + audit trail, and #6 PDF export.

test('#5: attach source evidence to a section and see it in the Evidence card', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  await page.locator('.section-tree button', { hasText: '8.1.2' }).click();
  // Open the Evidence & sources card and attach a screenshot as audit evidence.
  const card = page.locator('.collapsible-card-header', { hasText: 'Evidence & sources' }).first();
  if ((await card.getAttribute('aria-expanded')) !== 'true') await card.click();
  await page.getByRole('button', { name: /Attach source evidence/ }).click();
  await page.getByPlaceholder(/File name/).fill('Scope3-CDP-screenshot-2026.png');
  await page.getByPlaceholder(/Claim it supports/).fill('Scope 3 emissions were 4,047 ktCO2e');
  await page.getByRole('button', { name: /^Attach$/ }).click();
  await expect(page.getByText(/attached to this section/i)).toBeVisible();
  await expect(page.locator('.evidence-item').filter({ hasText: 'Scope3-CDP-screenshot-2026.png' })).toBeVisible();
});

test('#5: seeded source evidence appears in the audit trail', async ({ page }) => {
  await page.goto('/audit');
  // The seeded paragraph-anchored evidence (LTIR screenshot) is merged into the log.
  await expect(page.getByText(/Attached source evidence/).first()).toBeVisible();
});

test('#6: the export modal offers both PDF and DOCX', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await expect(page.getByRole('button', { name: /Generate PDF/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Word \(MDD\)/ })).toBeVisible();
});

test('#6: PDF and DOCX/MDD are both available any time (DOCX is a draft when not all-approved)', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  // Export policy 2026-08-21: both formats enabled at any time; a fresh demo is
  // not fully approved, so DOCX is offered as a clearly-labelled draft.
  await expect(page.getByRole('button', { name: /Generate PDF/ })).toBeEnabled();
  await expect(page.getByRole('button', { name: /Word \(MDD\) — draft/ })).toBeEnabled();
});

test('#6: generating the PDF triggers a .pdf download', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: /Generate PDF/ }).click();
  const download = await dl;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
});
