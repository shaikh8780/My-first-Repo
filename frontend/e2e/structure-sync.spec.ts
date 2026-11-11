import { test, expect } from '@playwright/test';

// Section Structure is a collapsible L1/L2/L3 tree; editing + publishing surfaces
// a review banner in the Report Editor that applies the change on confirm.
// localStorage persists across page.goto within a single test (same origin).

test('structure page renders the L1/L2/L3 tree', async ({ page }) => {
  await page.goto('/structure');
  await expect(page.getByRole('heading', { name: 'Section Structure' })).toBeVisible();
  // L1 chapter, L2 sub-topic and an L3 subsection row are all visible.
  // Names are editable inputs, so assert on their values.
  await expect(page.locator('input.struct-title-input[value="Business model"]')).toBeVisible();
  await expect(page.locator('input.struct-title-input[value="Corporate governance"]')).toBeVisible();
  await expect(page.locator('.struct-l3').first()).toBeVisible();
  // Add controls exist at both levels + the top-level add.
  await expect(page.getByRole('button', { name: '＋ Add top-level section (L1)' })).toBeVisible();
  await expect(page.getByRole('button', { name: '＋ sub-topic' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: '＋ subsection' }).first()).toBeVisible();
});

test('add a subsection, publish, and apply it in the Report Editor', async ({ page }) => {
  await page.goto('/structure');

  // Reset to a clean baseline so counts are deterministic.
  await page.getByRole('button', { name: 'Reset' }).click();

  // Add an L3 subsection under the first sub-topic (Corporate governance).
  await page.getByRole('button', { name: '＋ subsection' }).first().click();
  // The new row has a title input defaulting to "New subsection" — rename it.
  // Names commit on blur, so fill then blur.
  // New L3 row lands at the end of the Corporate governance group; it defaults
  // to "New subsection". Resolve to a concrete element handle so it stays valid
  // after the value changes, then edit + commit with Enter.
  const newRowInput = page.locator('input.struct-title-input[value="New subsection"]').first();
  await newRowInput.waitFor();
  const handle = await newRowInput.elementHandle();
  await handle!.fill('E2E New Subsection');
  await handle!.press('Enter');

  // Publish to the Report Editor — this now opens a confirmation dialog listing
  // the permanent changes; confirm to actually publish.
  await page.getByRole('button', { name: 'Publish to Report Editor' }).click();
  await expect(page.getByRole('heading', { name: 'Publish to Report Editor?' })).toBeVisible();
  await expect(page.getByText('E2E New Subsection')).toBeVisible(); // change is listed
  await page.getByRole('button', { name: 'Confirm & Publish' }).click();
  await expect(page.locator(".toast").filter({ hasText: /Published to Report Editor/ })).toBeVisible();

  // Go to the editor — the review banner should appear.
  await page.locator('.nav-item', { hasText: 'Report Editor' }).click();
  await expect(page).toHaveURL(/\/editor$/);
  await expect(page.locator('.struct-sync-banner')).toBeVisible();
  await expect(page.locator('.struct-sync-banner')).toContainText(/new/);

  // Review the diff, then apply.
  await page.getByRole('button', { name: 'Review changes' }).click();
  await expect(page.getByRole('heading', { name: 'Review structure changes' })).toBeVisible();
  await expect(page.getByText('E2E New Subsection')).toBeVisible();
  await page.getByRole('button', { name: 'Apply to report' }).click();

  await expect(page.getByText(/Structure applied/)).toBeVisible();
  // The banner is gone and the new subsection is in the editor tree.
  await expect(page.locator('.struct-sync-banner')).toHaveCount(0);
  await expect(page.locator('.section-tree').getByText('E2E New Subsection')).toBeVisible();
});

test('add a top-level (L1) section, rename it, and add a sub-topic to it', async ({ page }) => {
  await page.goto('/structure');
  await page.getByRole('button', { name: 'Reset' }).click();

  await page.getByRole('button', { name: '＋ Add top-level section (L1)' }).click();
  // The new L1 appears with an editable title input defaulting to "New section".
  // The new L1 is the last L1 input; it defaults to "New section".
  const l1Input = page.locator('.struct-l1 input.struct-l1-input').last();
  await expect(l1Input).toHaveValue('New section');

  // Rename it (commits on Enter) — the value must persist, proving it's editable.
  const l1Handle = await l1Input.elementHandle();
  await l1Handle!.fill('Custom Chapter');
  await l1Handle!.press('Enter');
  await expect(page.locator('input.struct-title-input[value="Custom Chapter"]')).toBeVisible();

  // A childless L1 can grow into a chapter via ＋ sub-topic.
  await page.locator('.struct-l1', { has: page.locator('input[value="Custom Chapter"]') })
    .getByRole('button', { name: '＋ sub-topic' }).click();
  await expect(page.locator('input.struct-title-input[value="New sub-topic"]')).toBeVisible();
});

test('L2 sub-topic name is editable', async ({ page }) => {
  await page.goto('/structure');
  await page.getByRole('button', { name: 'Reset' }).click();
  // Corporate governance is a Business-model L2 sub-topic. Resolve to a handle,
  // then edit + commit with Enter.
  const l2 = page.locator('.struct-l2 input.struct-l2-input[value="Corporate governance"]');
  await l2.waitFor();
  const l2Handle = await l2.elementHandle();
  await l2Handle!.fill('Corporate governance (2027)');
  await l2Handle!.press('Enter');
  await expect(page.locator('.struct-l2 input.struct-l2-input[value="Corporate governance (2027)"]')).toBeVisible();
});

test('reordering an L1 chapter publishes and applies to the editor', async ({ page }) => {
  await page.goto('/structure');
  await page.getByRole('button', { name: 'Reset' }).click();

  // Capture the editor's baseline order.
  await page.locator('.nav-item', { hasText: 'Report Editor' }).click();
  await expect(page).toHaveURL(/\/editor$/);
  const before = await page.locator('.section-tree').innerText();

  // Move the "Business model" chapter up one, then publish + confirm.
  await page.locator('.nav-item', { hasText: 'Section Structure' }).click();
  await page.locator('.struct-l1', { has: page.locator('input[value="Business model"]') })
    .locator('button[title="Move chapter up"]').click();
  await page.getByRole('button', { name: 'Publish to Report Editor' }).click();
  await expect(page.getByRole('heading', { name: 'Publish to Report Editor?' })).toBeVisible();
  await expect(page.getByText(/moved/)).toBeVisible(); // change summary lists moves
  await page.getByRole('button', { name: 'Confirm & Publish' }).click();

  // Editor shows the sync banner; applying changes the visible order.
  await page.locator('.nav-item', { hasText: 'Report Editor' }).click();
  await expect(page.locator('.struct-sync-banner')).toBeVisible();
  await expect(page.locator('.struct-sync-banner')).toContainText(/moved/);
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByText(/Structure applied/)).toBeVisible();
  const after = await page.locator('.section-tree').innerText();
  expect(after).not.toBe(before);
});

test('an already-open editor picks up a publish on focus (no remount)', async ({ page }) => {
  // Publish a change while the editor is the mounted view — the fix re-reads the
  // published channel on window focus / visibility change rather than only on mount.
  await page.goto('/structure');
  await page.getByRole('button', { name: 'Reset' }).click();
  await page.locator('.struct-l1', { has: page.locator('input[value="Business model"]') })
    .locator('button[title="Move chapter down"]').click();
  await page.getByRole('button', { name: 'Publish to Report Editor' }).click();
  await page.getByRole('button', { name: 'Confirm & Publish' }).click();

  await page.locator('.nav-item', { hasText: 'Report Editor' }).click();
  await expect(page.locator('.struct-sync-banner')).toBeVisible();

  // Dismiss so the banner reflects "applied" state, then simulate a second publish
  // made elsewhere and a focus event on the still-mounted editor.
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await expect(page.locator('.struct-sync-banner')).toHaveCount(0);

  await page.evaluate(() => {
    const key = 'structure-published:v3';
    const applied = JSON.parse(localStorage.getItem('structure-applied:v3') || '[]');
    // Swap the first two rows to create a fresh moved-diff, then re-publish.
    const rows = applied.slice();
    if (rows.length >= 2) [rows[0], rows[1]] = [rows[1], rows[0]];
    localStorage.setItem(key, JSON.stringify({ rows, publishedBy: 'OtherAdmin', publishedAt: '2026-07-08T00:00:00Z' }));
    window.dispatchEvent(new Event('focus'));
  });
  await expect(page.locator('.struct-sync-banner')).toBeVisible();
  await expect(page.locator('.struct-sync-banner')).toContainText('OtherAdmin');
});

test('publish history records each publish with a change summary', async ({ page }) => {
  await page.goto('/structure');
  await page.getByRole('button', { name: 'Reset' }).click();
  await page.locator('.struct-l1', { has: page.locator('input[value="Business model"]') })
    .locator('button[title="Move chapter up"]').click();
  await page.getByRole('button', { name: 'Publish to Report Editor' }).click();
  await page.getByPlaceholder(/2027 ESRS structure/).fill('Test release note');
  await page.getByRole('button', { name: 'Confirm & Publish' }).click();
  await expect(page.locator(".toast").filter({ hasText: /Published to Report Editor/ })).toBeVisible();

  // The history card lists the publish with author, summary and the note.
  const history = page.locator('.card', { hasText: 'Published to Report Editor — history' });
  await expect(history.getByText('Publish v1')).toBeVisible();
  await expect(history.getByText(/moved/)).toBeVisible();
  await expect(history.getByText(/Test release note/)).toBeVisible();
});

test('moving an L3 subsection up reorders it', async ({ page }) => {
  await page.goto('/structure');
  await page.getByRole('button', { name: 'Reset' }).click();
  // The first L3 group (Corporate governance) refs start 7.1.1, 7.1.2, ...
  // Move the 2nd row up; its ref should then precede the former first row.
  // Use a real sibling group: Corporate governance = 7.1.1, 7.1.2, 7.1.3 (indices 2,3,4).
  const l3rows = page.locator('.struct-l3');
  const refBefore = await l3rows.nth(3).locator('.struct-ref').textContent(); // 7.1.2
  await l3rows.nth(3).locator('button[title="Move up"]').click();
  // After moving up, that ref now sits at index 2 (where 7.1.1 was).
  const refAfter = await page.locator('.struct-l3').nth(2).locator('.struct-ref').textContent();
  expect(refAfter).toBe(refBefore);
});

test('a new L1 section keeps its name through publish + apply', async ({ page }) => {
  // Regression: renaming a freshly-added top-level (L1) section wrote to the
  // wrong field, so it surfaced in the editor as the default "New section".
  await page.goto('/structure');
  await page.getByRole('button', { name: 'Reset' }).click();

  await page.getByRole('button', { name: '＋ Add top-level section (L1)' }).click();
  const l1Input = page.locator('.struct-l1 input.struct-l1-input').last();
  const h = await l1Input.elementHandle();
  await h!.fill('My New Chapter');
  await h!.press('Enter');

  await page.getByRole('button', { name: 'Publish to Report Editor' }).click();
  // Listed as added under its real name (the L1 identity), not "New section".
  await expect(page.locator('.modal-content').getByText('My New Chapter')).toBeVisible();
  await page.getByRole('button', { name: 'Confirm & Publish' }).click();

  await page.locator('.nav-item', { hasText: 'Report Editor' }).click();
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByText(/Structure applied/)).toBeVisible();

  // The chapter appears under its real name — NOT the default "New section".
  await expect(page.locator('.section-tree').getByText('My New Chapter')).toBeVisible();
  await expect(page.locator('.section-tree').getByText('New section', { exact: true })).toHaveCount(0);
});

test('in-editor Table of Contents reflects a chapter reorder', async ({ page }) => {
  // The ToC view is built from the live/published sections. Reordering a chapter
  // in Section Structure and applying it must reorder the on-screen ToC too.
  await page.goto('/structure');
  await page.getByRole('button', { name: 'Reset' }).click();

  // Baseline ToC chapter order (level-1 entries) from the editor.
  await page.locator('.nav-item', { hasText: 'Report Editor' }).click();
  await page.locator('.section-tree').getByText('Table of Contents').click();
  const l1Before = await page.locator('.toc-row.toc-l1 .toc-entry-title').allInnerTexts();
  const iEnv = l1Before.indexOf('Environmental matters');
  const iSoc = l1Before.indexOf('Social matters');
  expect(iEnv).toBeGreaterThanOrEqual(0);
  expect(iSoc).toBeGreaterThan(iEnv); // Environmental precedes Social at baseline

  // Move "Social matters" up so it precedes "Environmental matters", then publish.
  await page.locator('.nav-item', { hasText: 'Section Structure' }).click();
  await page.locator('.struct-l1', { has: page.locator('input[value="Social matters"]') })
    .locator('button[title="Move chapter up"]').click();
  await page.getByRole('button', { name: 'Publish to Report Editor' }).click();
  await page.getByRole('button', { name: 'Confirm & Publish' }).click();

  // Apply in the editor, then re-open the ToC — Social now precedes Environmental.
  await page.locator('.nav-item', { hasText: 'Report Editor' }).click();
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByText(/Structure applied/)).toBeVisible();
  await page.locator('.section-tree').getByText('Table of Contents').click();
  const l1After = await page.locator('.toc-row.toc-l1 .toc-entry-title').allInnerTexts();
  expect(l1After.indexOf('Social matters')).toBeLessThan(l1After.indexOf('Environmental matters'));
});
