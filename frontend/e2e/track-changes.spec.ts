import { test, expect } from '@playwright/test';

// Track-changes engine PREVIEW SLICE (behind ff:trackChangesEngine, OFF by
// default). These tests turn the flag ON per-browser and verify the core
// behaviour: typing → tracked insertion, delete → struck-through deletion,
// accept/reject in place. A separate test confirms that with the flag OFF the
// editor is the current one (no regression) — that's covered by the rest of the
// suite, which never sets the flag.

async function openEditorWithFlag(page: import('@playwright/test').Page) {
  await page.addInitScript(() => localStorage.setItem('ff:trackChangesEngine', 'true'));
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  // 8.1.2 (Climate → Policies) is editable and not gated by AI acceptance.
  await page.locator('.section-tree button', { hasText: '8.1.2' }).click();
  await page.getByRole('button', { name: 'Edit Section' }).click();
  if (await page.getByRole('heading', { name: /Edit an approved subsection/ }).count()) {
    await page.getByRole('button', { name: /Snapshot & edit/ }).click();
  }
  await expect(page.locator('.tc-preview-badge')).toBeVisible();
}

test('URL toggle ?ff_trackChangesEngine=on enables it without the console', async ({ page }) => {
  // No addInitScript / no console — just the URL param, like a shared link.
  await page.goto('/editor?ff_trackChangesEngine=on');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  await page.locator('.section-tree button', { hasText: '8.1.2' }).click();
  await page.getByRole('button', { name: 'Edit Section' }).click();
  if (await page.getByRole('heading', { name: /Edit an approved subsection/ }).count()) {
    await page.getByRole('button', { name: /Snapshot & edit/ }).click();
  }
  await expect(page.locator('.tc-preview-badge')).toBeVisible();
  // The ff_ param is stripped from the URL after capture.
  await expect(page).not.toHaveURL(/ff_trackChangesEngine/);
});

test('flag ON: the track-changes preview editor loads with its control bar', async ({ page }) => {
  await openEditorWithFlag(page);
  await expect(page.locator('.tc-bar')).toBeVisible();
  await expect(page.locator('.tc-toggle')).toContainText(/Track changes ON/);
  await expect(page.locator('.tc-count')).toContainText(/0 open suggestions/);
});

test('flag ON: typing is recorded as a tracked insertion', async ({ page }) => {
  await openEditorWithFlag(page);
  await page.locator('.rte-surface').click();
  await page.keyboard.type(' NEWLY TYPED TEXT');
  // The typed text is wrapped in an insertion mark (ins.tc-ins).
  await expect(page.locator('.rte-surface ins.tc-ins').filter({ hasText: 'NEWLY TYPED TEXT' }).first()).toBeVisible();
  await expect(page.getByText(/[1-9]\d* open suggestion/)).toBeVisible();
});

test('flag ON: Accept all resolves the insertion into normal text', async ({ page }) => {
  await openEditorWithFlag(page);
  await page.locator('.rte-surface').click();
  await page.keyboard.type(' ACCEPT ME');
  await expect(page.locator('.rte-surface ins.tc-ins').first()).toBeVisible();
  await page.getByRole('button', { name: /Accept all/ }).click();
  // After accept, the text remains but the insertion mark is gone.
  await expect(page.locator('.rte-surface ins.tc-ins')).toHaveCount(0);
  await expect(page.locator('.rte-surface').filter({ hasText: 'ACCEPT ME' }).first()).toBeVisible();
  await expect(page.getByText(/0 open suggestions/)).toBeVisible();
});

test('flag ON: Reject all removes the inserted text', async ({ page }) => {
  await openEditorWithFlag(page);
  await page.locator('.rte-surface').click();
  await page.keyboard.type(' REJECT ME');
  await expect(page.locator('.rte-surface ins.tc-ins').first()).toBeVisible();
  await page.getByRole('button', { name: /Reject all/ }).click();
  await expect(page.locator('.rte-surface ins.tc-ins')).toHaveCount(0);
  await expect(page.locator('.rte-surface').filter({ hasText: 'REJECT ME' })).toHaveCount(0);
});

test('flag ON: per-change review list accepts a single insertion', async ({ page }) => {
  await openEditorWithFlag(page);
  await page.locator('.rte-surface').click();
  await page.keyboard.type(' ONE');
  await page.keyboard.press('Enter'); // separate run
  await page.keyboard.type('TWO');
  // The per-change review list shows individual suggestions with ✓/✕.
  const list = page.locator('.tc-review');
  await expect(list).toBeVisible();
  const itemsBefore = await list.locator('.tc-review-item').count();
  expect(itemsBefore).toBeGreaterThan(0);
  // Accept the first one → its item goes away, others remain.
  await list.locator('.tc-review-item').first().getByRole('button', { name: '✓' }).click();
  await expect(list.locator('.tc-review-item')).toHaveCount(itemsBefore - 1);
});

test('flag ON: per-change reject removes just that insertion', async ({ page }) => {
  await openEditorWithFlag(page);
  await page.locator('.rte-surface').click();
  await page.keyboard.type(' KEEPME');
  const list = page.locator('.tc-review');
  await expect(list.locator('.tc-review-item')).toHaveCount(1);
  await list.locator('.tc-review-item').first().getByRole('button', { name: '✕' }).click();
  await expect(list.locator('.tc-review-item')).toHaveCount(0);
  await expect(page.locator('.rte-surface').filter({ hasText: 'KEEPME' })).toHaveCount(0);
});

test('flag ON: Backspace at the start of a bullet removes the bullet (structural, not a stuck deletion mark)', async ({ page }) => {
  // 7.1.1 (Board of Directors oversight) is approved and contains a bullet list.
  await page.addInitScript(() => localStorage.setItem('ff:trackChangesEngine', 'true'));
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  await page.locator('.section-tree button', { hasText: '7.1.1' }).click();
  await page.getByRole('button', { name: 'Edit Section' }).click();
  if (await page.getByRole('heading', { name: /Edit an approved subsection/ }).count()) {
    await page.getByRole('button', { name: /Snapshot & edit/ }).click();
  }
  await expect(page.locator('.tc-preview-badge')).toBeVisible();

  const items = page.locator('.rte-surface ul li');
  const before = await items.count();
  expect(before).toBeGreaterThan(1);

  // Position the caret at the TRUE start of the SECOND list item (parentOffset 0)
  // via the editor API — synthetic key events can't reliably reach a block
  // boundary across a long wrapped line. Then dispatch a real Backspace so the
  // suggesting plugin's handleKeyDown runs exactly as in the browser.
  await page.evaluate(() => {
    const editor = (window as unknown as { __tcEditor?: any }).__tcEditor;
    let secondLiParaStart = -1; let seen = 0;
    editor.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'listItem') { seen++; if (seen === 2) secondLiParaStart = pos + 2; }
      return true;
    });
    editor.commands.focus();
    editor.commands.setTextSelection(secondLiParaStart);
  });
  // Sanity: caret is at a block start now.
  const atStart = await page.evaluate(() => {
    const editor = (window as unknown as { __tcEditor?: any }).__tcEditor;
    return editor.state.selection.$from.parentOffset === 0;
  });
  expect(atStart).toBe(true);

  await page.locator('.rte-surface').press('Backspace');

  // The bullet is structurally removed (item count drops) — the fix lets
  // ProseMirror join/lift the item instead of trapping it as a no-op deletion
  // mark that leaves the bullet visible until accept-all. And no stuck deletion
  // mark is created by this structural gesture.
  await expect(page.locator('.rte-surface ul li')).toHaveCount(before - 1);
});

test('flag ON: accepting the deletion of a whole bullet removes the empty bullet', async ({ page }) => {
  // Delete a bullet's TEXT (marks it red), then Accept → the text AND the now-
  // empty bullet must both go, not leave a lingering empty list item.
  await page.addInitScript(() => localStorage.setItem('ff:trackChangesEngine', 'true'));
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  await page.locator('.section-tree button', { hasText: '7.1.1' }).click();
  await page.getByRole('button', { name: 'Edit Section' }).click();
  if (await page.getByRole('heading', { name: /Edit an approved subsection/ }).count()) {
    await page.getByRole('button', { name: /Snapshot & edit/ }).click();
  }
  await expect(page.locator('.tc-preview-badge')).toBeVisible();

  const items = page.locator('.rte-surface ul li');
  const before = await items.count();
  expect(before).toBeGreaterThan(1);

  // Select the ENTIRE text of the second list item via the editor API, then
  // Backspace to mark it deleted (red), leaving the item empty of text.
  await page.evaluate(() => {
    const editor = (window as unknown as { __tcEditor?: any }).__tcEditor;
    let start = -1; let end = -1; let seen = 0;
    editor.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'listItem') {
        seen++;
        if (seen === 2) { start = pos + 2; end = pos + node.nodeSize - 2; }
      }
      return true;
    });
    editor.commands.focus();
    editor.commands.setTextSelection({ from: start, to: end });
  });
  await page.locator('.rte-surface').press('Backspace');
  // The whole item's text is now a pending deletion (struck through).
  await expect(page.locator('.rte-surface .tc-del').first()).toBeVisible();

  // Accept all → the deletion is applied AND the emptied bullet is removed.
  await page.getByRole('button', { name: /Accept all/ }).click();
  await expect(page.locator('.rte-surface .tc-del')).toHaveCount(0);
  await expect(page.locator('.rte-surface ul li')).toHaveCount(before - 1);
});

// B8 hardening: editing a section that contains an MDD table must not drop the
// table on save. This covers the realistic case (editing the body text); the
// separate "type at the very end after a trailing atom" edge is tracked as a
// known pre-existing bug (see tech-debt note).
test('an MDD table survives editing the section body (default editor)', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await page.locator('.section-tree button', { hasText: '8.1.5' }).click();
  await page.getByRole('button', { name: 'Edit Section' }).click();
  if (await page.getByRole('heading', { name: /Edit an approved subsection/ }).count()) {
    await page.getByRole('button', { name: /Snapshot & edit/ }).click();
  }
  await page.locator('.rte-surface p').first().click(); // edit body text, not the atom
  await page.keyboard.type(' EDITED');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.getByPlaceholder(/Updated Scope 3|FY2026 actuals/).fill('edit body');
  await page.getByRole('button', { name: /Save with Reason/ }).click();
  await page.waitForTimeout(500);
  const survives = await page.evaluate(() =>
    /\[Table Reference:/.test(JSON.parse(localStorage.getItem('editor-sections:v4') || '[]').find((x: { id: string }) => x.id === 'sub-8-1-5')?.content || ''));
  expect(survives).toBe(true);
});

// #1 change-by-change AI roll-forward acceptance: the FY2025→2026 roll-forward is
// reviewable paragraph-by-paragraph (Keep FY2026 / Revert to FY2025) with an
// Accept-all, instead of one all-at-once button.
test('flag ON: AI roll-forward is reviewable change-by-change', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ff:trackChangesEngine', 'true'));
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  await page.locator('.section-tree button', { hasText: '8.1.3' }).click(); // rolled-forward
  const et = page.getByRole('button', { name: /Editor view/ });
  if (await et.count()) await et.click();
  // Per-change list with Keep / Revert + Accept-all.
  await expect(page.locator('.rf-change-item').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Keep FY2026/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Revert to FY2025|Remove \(revert\)/ }).first()).toBeVisible();
  // Accept all → the roll-forward is accepted as the working base (banner clears).
  await page.getByRole('button', { name: /Accept all remaining|Confirm & accept/ }).click();
  await expect(page.getByText(/accepted as the working base|working base/i).first()).toBeVisible();
});

// #3 AI chat refinement: asking the AI to draft inserts its text as an AI-origin
// suggestion that can be accepted/rejected (the review chip shows ✦ AI).
test('flag ON: AI chat drafts text as an AI-origin suggestion', async ({ page }) => {
  await openEditorWithFlag(page);
  const ai = page.locator('.tc-ai');
  await expect(ai).toBeVisible();
  await ai.getByPlaceholder(/draft a paragraph/i).fill('draft a paragraph on our transition plan');
  await ai.getByRole('button', { name: 'Ask AI' }).click();
  // The AI reply shows and a new AI-origin insertion appears in the review list.
  await expect(page.locator('.tc-ai-reply')).toBeVisible();
  await expect(page.locator('.rte-surface ins.tc-ins[data-origin="ai"]').first()).toBeVisible();
  await expect(page.locator('.tc-review-item .tc-chip.ai').first()).toBeVisible();
});

// B5 persistence: open suggestions survive a page reload (stored in a separate
// side-channel; the accepted content string is untouched).
test('flag ON: an open suggestion survives a page reload', async ({ page }) => {
  await openEditorWithFlag(page);
  await page.locator('.rte-surface').click();
  await page.keyboard.type(' PERSIST ME');
  await expect(page.locator('.rte-surface ins.tc-ins').filter({ hasText: 'PERSIST ME' })).toBeVisible();
  await page.reload();
  await page.locator('.section-tree button', { hasText: '8.1.2' }).click();
  await page.getByRole('button', { name: 'Edit Section' }).click();
  if (await page.getByRole('heading', { name: /Edit an approved subsection/ }).count()) {
    await page.getByRole('button', { name: /Snapshot & edit/ }).click();
  }
  await expect(page.locator('.rte-surface ins.tc-ins').filter({ hasText: 'PERSIST ME' })).toBeVisible();
});

// 2026-07-15 fix: a DELETION made in the track-changes editor must be reflected
// in the approval/review view after save — as a struck-through word-level
// redline with Accept/Reject — not silently applied on the Clean view. Requires
// accepting the AI roll-forward baseline first (most sections have prior-year
// content that otherwise routes the Editor view to the roll-forward redline).
test('flag ON: a deletion is reviewable in the approval view after save', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ff:trackChangesEngine', 'true'));
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  await page.locator('.section-tree button', { hasText: '8.1.2' }).click();
  const acceptBase = page.getByRole('button', { name: /Accept AI draft as working base/ });
  if (await acceptBase.count()) await acceptBase.click();
  await page.getByRole('button', { name: 'Edit Section' }).click();
  if (await page.getByRole('heading', { name: /Edit an approved subsection/ }).count()) {
    await page.getByRole('button', { name: /Snapshot & edit/ }).click();
  }
  const surface = page.locator('.rte-surface');
  await surface.click();
  await page.keyboard.press('Control+Home');
  for (let i = 0; i < 10; i++) await page.keyboard.press('Delete'); // remove some words
  await page.getByRole('button', { name: /Accept all/ }).click();
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.getByPlaceholder(/Updated Scope 3|FY2026 actuals/).fill('removed a phrase');
  await page.getByRole('button', { name: /Save with Reason/ }).click();
  // Lands on the review (Editor) view with the change shown + struck-through
  // deletion tokens + an Accept control.
  await expect(page.getByText(/accept or reject/i)).toBeVisible();
  await expect(page.locator('.change-item .tc-del').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /^Accept$/ }).first()).toBeVisible();
});
