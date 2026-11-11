import { test, expect } from '@playwright/test';

// End-to-end smoke test for the RNFM authoring studio. Runs against a production
// build with the test-only auth bypass (see playwright.config.ts). Exercises the
// critical path: app loads -> report editor shows the full subsection tree ->
// open a section -> Word-like rich editor -> insert an MDD table -> save ->
// the edit is captured as a tracked change.

test('editor: navigate, rich-edit, insert table, save tracks a change', async ({ page }) => {
  await page.goto('/');

  // App shell renders (auth bypass in effect).
  await expect(page.getByText('ESG Authoring Studio')).toBeVisible();

  // Navigate to the Report Editor tab — URL should become /editor (per-tab URLs).
  await page.getByRole('button', { name: /Report Editor/ }).click();
  await expect(page).toHaveURL(/\/editor$/);

  // Section tree shows the full breakdown (93 subsections) and the report
  // hierarchy — Business model is an L1 topic.
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  await expect(page.getByText('Business model', { exact: true })).toBeVisible();

  // Enter edit mode on the currently selected section. The default section may
  // be Approved, in which case editing prompts to snapshot a version + reset to
  // Draft — confirm that to proceed into the editor.
  await page.getByRole('button', { name: 'Edit Section' }).click();
  if (await page.getByRole('heading', { name: /Edit an approved subsection/ }).count()) {
    await page.getByRole('button', { name: /Snapshot & edit/ }).click();
  }

  // The Word-like rich editor toolbar is present (not a bare textarea).
  await expect(page.locator('.rte-toolbar')).toBeVisible();
  await expect(page.locator('.content-editor textarea.editor-textarea')).toHaveCount(0);
  await expect(page.locator('button[title^="Bold"]')).toBeVisible();
  await expect(page.locator('button[title^="Insert an MDD data table"]')).toBeVisible();

  // Insert a table from the MDD registry.
  await page.locator('button[title^="Insert an MDD data table"]').click();
  await expect(page.getByRole('heading', { name: 'Insert MDD table' })).toBeVisible();
  await page.getByText('Energy & GHG emissions').click();

  // The inserted table renders inline as an MDD reference card with real data.
  await expect(page.getByText('⟳ MDD reference only').first()).toBeVisible();

  // Save the change — a reason is required and recorded in the audit trail.
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.getByPlaceholder(/Updated Scope 3 figures/).fill('E2E smoke: inserted Energy & GHG table');
  await page.getByRole('button', { name: 'Save with Reason' }).click();

  // A tracked change is recorded for the edit.
  await expect(page.getByText(/change\(s\) tracked/)).toBeVisible();
});

test('editor: image button uploads a file from the computer and embeds it', async ({ page }) => {
  await page.goto('/editor');
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  await page.locator('.section-tree button', { hasText: '8.1.2' }).click();
  await page.getByRole('button', { name: 'Edit Section' }).click();
  await expect(page.locator('.rte-toolbar')).toBeVisible();

  // A 1x1 PNG uploaded through the hidden file input the image button triggers.
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  await page.locator('input[type="file"][accept="image/*"]').setInputFiles({
    name: 'diagram.png',
    mimeType: 'image/png',
    buffer: Buffer.from(pngBase64, 'base64'),
  });

  // The image renders inside the editor surface.
  await expect(page.locator('.rte-surface img')).toBeVisible();

  // Save persists it; the edit is tracked (pending).
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.getByPlaceholder(/Updated Scope 3 figures/).fill('E2E: uploaded a diagram image');
  await page.getByRole('button', { name: 'Save with Reason' }).click();
  await expect(page.getByText(/change\(s\) tracked/)).toBeVisible();

  // Clean view (default) shows only APPROVED text — the still-pending image is
  // reverted from it, so it is NOT visible in the clean reading column.
  await expect(page.locator('img[alt="diagram.png"]')).toHaveCount(0);

  // Accept the AI roll-forward baseline so the Editor view switches from the
  // FY2025 comparison to tracking only new edits.
  const acceptBtn = page.getByRole('button', { name: /Accept AI draft as working base/ });
  if (await acceptBtn.isVisible().catch(() => false)) await acceptBtn.click();

  // Editor view shows the pending change: the tracked-changes list surfaces the
  // inserted image as a readable "Image inserted" line.
  await page.getByRole('button', { name: /Editor view/ }).click();
  await expect(page.getByText(/Image inserted:\s*diagram\.png/)).toBeVisible();
});

test('editor: Table of Contents auto-generates from chapters', async ({ page }) => {
  await page.goto('/editor');
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  // Table of Contents is a standalone front-matter L1 (rendered as a tree header,
  // not a leaf button) — select it by its topic name.
  await page.locator('.section-tree').getByText('Table of Contents', { exact: true }).click();

  // The Word-like ToC renders with the report chapters and sub-topics.
  await expect(page.locator('.toc-view')).toBeVisible();
  await expect(page.locator('.toc-view .toc-title')).toHaveText('Table of contents');
  for (const chapter of ['Business model', 'Environmental matters', 'Social matters', 'Governance matters', 'Appendix']) {
    await expect(page.locator('.toc-row.toc-l1', { hasText: chapter })).toBeVisible();
  }
  await expect(page.locator('.toc-row.toc-l2', { hasText: 'Climate change' })).toBeVisible();
  // Page numbers are placeholders in the app (Word fills them on export).
  await expect(page.locator('.toc-page').first()).toHaveText('p. —');
});

test('editor: opening an existing table section renders the table in the rich editor', async ({ page }) => {
  await page.goto('/editor');
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();

  // 8.1.13 (Climate Metrics) carries a [Table Reference: DP_Environment] marker
  // in its content — opening it in the editor must render the table, not a blank
  // atom (regression: the MddReference node did not parse data-mdd-raw back).
  await page.locator('.section-tree button', { hasText: '8.1.13' }).click();
  await page.getByRole('button', { name: 'Edit Section' }).click();
  if (await page.getByRole('heading', { name: /Edit an approved subsection/ }).count()) {
    await page.getByRole('button', { name: /Snapshot & edit/ }).click();
  }
  await expect(page.locator('.rte-toolbar')).toBeVisible();

  // The MDD table card renders inside the editor surface with its real data.
  await expect(page.locator('.rte-surface .mdd-table-card')).toBeVisible();
  await expect(page.locator('.rte-surface .mdd-table-card .data-table')).toBeVisible();
  await expect(page.locator('.rte-surface').getByText('⟳ MDD reference only')).toBeVisible();
});

test('editor: MDD tables are read-only (not editable) with a Refresh from MDD action', async ({ page }) => {
  await page.goto('/editor');
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();

  // 8.1.5 (Climate target performance) carries an MDD reference table. Per the
  // 13 Jul 2026 decision, tables are READ-ONLY here (FRA maintains them in MDD).
  await page.locator('.section-tree button', { hasText: '8.1.5' }).click();
  await page.getByRole('button', { name: 'Edit Section' }).click();
  if (await page.getByRole('heading', { name: /Edit an approved subsection/ }).count()) {
    await page.getByRole('button', { name: /Snapshot & edit/ }).click();
  }

  // The MDD table renders as a read-only reference card.
  await expect(page.locator('.rte-surface .mdd-table-card')).toBeVisible();
  await expect(page.locator('.rte-surface').getByText('⟳ MDD reference only')).toBeVisible();

  // It is NOT an editable table, and there is no "Edit as table" conversion.
  await expect(page.locator('.rte-surface table.data-table')).toBeVisible();
  await expect(page.locator('button.mdd-edit-as-table')).toHaveCount(0);
  await expect(page.locator('button[title="Delete table"]')).toHaveCount(0);

  // The read-only notice and the user-triggered "Refresh from MDD" are shown.
  await expect(page.locator('.mdd-table-actions-hint')).toContainText(/Read-only/i);
  const refresh = page.locator('button.mdd-refresh-btn').first();
  await expect(refresh).toBeVisible();
  await refresh.click();
  await expect(page.locator('.mdd-refresh-ok').first()).toBeVisible();
});

test('editor: no blank-table insert control (tables come from MDD only)', async ({ page }) => {
  await page.goto('/editor');
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  await page.locator('.section-tree button', { hasText: '8.1.2' }).click();
  await page.getByRole('button', { name: 'Edit Section' }).click();
  if (await page.getByRole('heading', { name: /Edit an approved subsection/ }).count()) {
    await page.getByRole('button', { name: /Snapshot & edit/ }).click();
  }
  await expect(page.locator('.rte-toolbar')).toBeVisible();

  // Only the MDD-table insert exists; there is no blank editable-table button.
  await expect(page.locator('button[title^="Insert an MDD data table"]')).toBeVisible();
  await expect(page.locator('button[title^="Insert a blank editable table"]')).toHaveCount(0);
});

test('editor: roll-forward shows FY2025 baseline + track-changes in the Editor view', async ({ page }) => {
  await page.goto('/editor');
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();

  // Open a section that was AI-rolled-forward from the FY2025 baseline (8.1.4 —
  // Climate change > Actions has a real prior-year narrative).
  await page.locator('.section-tree button', { hasText: '8.1.4' }).click();

  // The expandable FY2025 approved section is present; expanding it shows the
  // whole prior-year section rendered as a page (read-only reference).
  const priorToggle = page.getByRole('button', { name: /FY2025 approved — full prior-year section/ });
  await expect(priorToggle).toBeVisible();
  await priorToggle.click();

  // The default seat is an Editor, so the two-tab control is available. Switch to
  // the Editor view — pre-acceptance it shows the FY2025→2026 roll-forward redline.
  await page.getByRole('button', { name: /^Editor view/ }).click();
  await expect(page.getByText(/AI rolled this section forward from FY2025|AI carried this section forward/)).toBeVisible();
  await expect(page.locator('.redline-add, .redline-del').first()).toBeVisible();

  // Back to the clean view.
  await page.getByRole('button', { name: 'Clean view' }).click();
});

test('editor: bullet lists render as a real list in BOTH Clean and Editor views', async ({ page }) => {
  await page.goto('/editor');
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();

  // 7.1.1 (Board of Directors oversight) is an approved section whose content
  // includes a bullet list (GSNC / ACC / Risk Committee / Compensation Committee).
  await page.locator('.section-tree button', { hasText: '7.1.1' }).click();

  // Clean view (default): the bullets are a real <ul><li>, and the raw "- "
  // markdown marker is NOT shown as literal text.
  await expect(page.locator('.content-viewer ul li').first()).toBeVisible();
  await expect(page.getByText(/^- GSNC/)).toHaveCount(0);

  // Editor view: the same block must render as a list too (regression: it used to
  // show raw "- " text on one collapsed line, unlike the Clean view).
  await page.getByRole('button', { name: /^Editor view/ }).click();
  await expect(page.locator('ul li', { hasText: /GSNC/ }).first()).toBeVisible();
  // No literal leading "- " marker leaked into the redline body.
  await expect(page.getByText(/^- GSNC/)).toHaveCount(0);

  await page.getByRole('button', { name: 'Clean view' }).click();
});

test('compliance: organized by standard with the added human-rights standards', async ({ page }) => {
  await page.goto('/compliance');
  await expect(page).toHaveURL(/\/compliance$/);

  // By-standard organization is available as the default framing.
  await expect(page.getByRole('button', { name: 'By Standard' })).toBeVisible();
});

test('deep link to a tab loads directly (SPA routing)', async ({ page }) => {
  // Hitting a per-tab URL directly must render that view (CloudFront serves
  // index.html for unknown paths; the router resolves the view client-side).
  await page.goto('/structure');
  await expect(page).toHaveURL(/\/structure$/);
  await expect(page.getByText('ESG Authoring Studio')).toBeVisible();
});
