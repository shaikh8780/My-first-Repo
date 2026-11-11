import { test, expect } from '@playwright/test';

// Regression: a RETURNING user whose localStorage holds a pre-Wave-2 editor
// cache (the OLD SubsectionRoles shape — ownerSignoff/legalSignoff, no owners[])
// must NOT get a blank screen. Wave 2 reshaped roles but left the schema at v3;
// the Dashboard rollup + editor read that stale blob and crashed on
// roles.owners. Fixed by bumping the schema to v4 (abandon stale caches) and
// null-safe reads. This test seeds the old shape under the v3 keys and asserts
// the app still renders on both the landing (Dashboard) and the editor.

const STALE_V3_SECTION = {
  id: 'sub-1-0', number: '1.0', ref: '1.0', title: 'Front Cover',
  topicL1: 'Front Cover', contentFormat: 'Text', stage: 'draft',
  content: 'Stale cached content', rollForwardStatus: 'unchanged',
  drsCovered: [], citations: [], wordCount: 3, lastModified: '2026-01-01T00:00:00Z',
  // OLD Wave-1 roles shape — this is what crashed the app (no owners[]).
  roles: { inputProvider: 'A', informed: 'B', ownerSignoff: 'C', legalSignoff: 'D' },
};

async function seedStaleCache(page: import('@playwright/test').Page) {
  await page.addInitScript((section) => {
    localStorage.setItem('editor-sections:v3', JSON.stringify([section]));
    localStorage.setItem('editor-ip-signoff:v3', JSON.stringify(['sub-1-0']));
  }, STALE_V3_SECTION);
}

test('returning user with a pre-Wave-2 (v3) cache still renders the Dashboard', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await seedStaleCache(page);
  await page.goto('/dashboard');
  // The Dashboard rollup reads editor-sections; with the fix it ignores the
  // stale v3 blob and renders rather than crashing to a blank #root.
  await expect(page.getByText(/Dashboard/).first()).toBeVisible();
  expect(errors, `page errors: ${errors.join(' | ')}`).toHaveLength(0);
});

test('returning user with a pre-Wave-2 (v3) cache still renders the editor', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await seedStaleCache(page);
  await page.goto('/editor');
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  expect(errors, `page errors: ${errors.join(' | ')}`).toHaveLength(0);
});
