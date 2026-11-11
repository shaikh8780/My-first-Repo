import { test, expect, Page } from '@playwright/test';

// Reviewer / approval workflow (Adrian 2026-08-31 model): each subsection has
// one or more Input Providers (edit + comment; NO sign-off — an edit marks the
// section "edited", the Editor marks it "updated") and one or more Owners (edit
// in track changes + sign off L2). Every non-legal owner must sign; among Legal/
// Compliance owners a single sign-off suffices. Editor/Admin accept-reject
// changes; Guest is read-only + comment; Auditor has a dedicated read-only view.
// A "view as role" switcher lets one demo user act each seat.

async function openClimatePolicies(page: Page) {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  await page.locator('.section-tree button', { hasText: '8.1.2' }).click();
  // Content card is the primary surface now; the Approval workflow moved to a
  // collapsed card at the bottom (13 Jul 2026 feedback #1).
  await expect(page.locator('.collapsible-card-header', { hasText: 'Content' }).first()).toBeVisible();
}

async function viewAs(page: Page, role: 'input_provider' | 'editor' | 'owner' | 'owner2' | 'admin' | 'guest') {
  // The header "View as" select — options carry the ActingRole value (Admin is
  // the default seat; there is no "me" option).
  await page.locator('select[title*="View the studio as"]').selectOption(role);
}

// The subsection detail is organised into collapsible cards; Changes and Comments
// start collapsed. Expand the named card so its contents are interactable.
async function openCard(page: Page, title: string) {
  const header = page.locator('.collapsible-card-header', { hasText: title }).first();
  if ((await header.getAttribute('aria-expanded')) !== 'true') {
    await header.click();
  }
}

test('approval panel is a stepper: Content updated → Owner(s) at L2', async ({ page }) => {
  await openClimatePolicies(page);
  await openCard(page, 'Approval workflow'); // collapsed card at the bottom
  const panel = page.locator('.approval-panel');
  // Climate sections carry two owners (content owner + legal-as-owner), so the
  // stepper is "Content updated" + one step per owner (L2). The legal owner
  // step is labelled "Legal owner".
  await expect(panel.locator('.appr-step')).toHaveCount(3);
  await expect(panel.locator('.appr-step-label', { hasText: 'Content updated' })).toBeVisible();
  await expect(panel.locator('.appr-step-label', { hasText: /Owner|Legal owner/ }).first()).toBeVisible();
  // A single headline status pill summarises where the section is.
  await expect(panel.locator('.appr-status')).toBeVisible();
});

test('Owner sign-off is section-level (L2), surfaced via details + section view', async ({ page }) => {
  await openClimatePolicies(page);
  await openCard(page, 'Approval workflow');
  const panel = page.locator('.approval-panel');
  // Owner steps carry the L2 badge (they act at section level, not here).
  await expect(panel.locator('.appr-level').first()).toHaveText('L2');
  // Expand details → the L2 explanation + the "open section view" action appear.
  await panel.getByRole('button', { name: /Details/ }).click();
  await expect(panel.getByText(/review and sign off at the .*section \(L2\).* level/i)).toBeVisible();
  await expect(panel.getByRole('button', { name: /Open .* section view/ })).toBeVisible();
});

test('L2 owner sign-off gate is shown in the section view (all owners must sign)', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  // Open the Climate change consolidated (L2) view.
  await page.locator('.section-tree').getByText('Climate change', { exact: true }).first().click();
  await expect(page.locator('.app-content').getByText(/consolidated section/i).first()).toBeVisible();
  // The section-level owner sign-off gate is present (all owners must sign at L2).
  await expect(page.getByText(/Owner sign-off \(L2\):/)).toBeVisible();
  await expect(page.getByText(/all \d+ owners? have signed off/i)).toBeVisible();
});

test('AI can draft a datapoint as a tracked (pending) insertion', async ({ page }) => {
  await openClimatePolicies(page);
  page.on('dialog', d => d.accept('ESRS-E1-4'));
  await page.getByRole('button', { name: /AI: Draft datapoint/ }).click();
  await expect(page.getByText(/AI drafted proposed text for ESRS-E1-4/)).toBeVisible();
});

// Wave 3 — prompt-driven in-editor AI chat that outputs a tracked change.
test('AI Assistant chat proposes text and inserts it as a tracked change', async ({ page }) => {
  await openClimatePolicies(page);
  await page.getByRole('button', { name: /AI Assistant/ }).click();
  const panel = page.locator('.ai-panel');
  await expect(panel).toBeVisible();
  // A quick-prompt returns a proposed edit the user can insert as a tracked change.
  await panel.getByText('What do peers report here?').click();
  await expect(panel.locator('.ai-proposed-text')).toBeVisible();
  await panel.getByRole('button', { name: /Insert as tracked change/ }).click();
  await expect(page.getByText(/inserted as a pending tracked change/i)).toBeVisible();
});

// Wave 3 — auto typo/style/consistency review surfaces flags and applies fixes
// as tracked changes. 8.2.3 (Pollution of water → Actions) has a seeded 2025
// target-year consistency issue that the analyzer flags.
test('AI Review tab flags a consistency issue and applies it as a tracked change', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  await page.locator('.section-tree button', { hasText: '8.2.3' }).click();
  await page.getByRole('button', { name: /AI Assistant/ }).click();
  const panel = page.locator('.ai-panel');
  await panel.getByRole('button', { name: /^Review/ }).click();
  const flag = panel.locator('.ai-flag').first();
  await expect(flag).toBeVisible();
  await flag.getByRole('button', { name: /Apply as tracked change/ }).click();
  await expect(page.getByText(/inserted as a pending tracked change/i)).toBeVisible();
});

// Wave 3 — per-section evidence: attach a document, then ground the AI in it.
test('Evidence tab attaches a document and grounds the AI draft in it', async ({ page }) => {
  await openClimatePolicies(page);
  await page.getByRole('button', { name: /AI Assistant/ }).click();
  const panel = page.locator('.ai-panel');
  await panel.getByRole('button', { name: /^Evidence/ }).click();
  await panel.getByPlaceholder(/Document name/).fill('Water-EHS-Audit-2026.pdf');
  await panel.getByRole('button', { name: /Attach evidence/ }).click();
  await expect(page.getByText(/attached to this section/i)).toBeVisible();
  // Grounding switches to Chat with the doc attached; asking to update the text
  // yields a proposed edit that references the document.
  await panel.getByRole('button', { name: /Ground AI in this/ }).first().click();
  await expect(panel.locator('.ai-attached')).toContainText('Water-EHS-Audit-2026.pdf');
  await panel.getByPlaceholder(/Ask about this section/).fill('update the text to reflect this document');
  await panel.getByRole('button', { name: 'Send' }).click();
  await expect(panel.locator('.ai-proposed-text')).toContainText('Water-EHS-Audit-2026.pdf');
});

test('Editor editing an approved section is post-approval (no auto reset)', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();

  // 1.0 Front Cover starts Approved. The default demo seat is an Editor/Admin, so
  // editing an approved subsection is a logged post-approval edit and does NOT
  // reset it to Draft or force re-approval (2026-07-09 rules).
  await page.locator('.section-tree').getByText('Front Cover').first().click();
  await expect(page.locator('.status-badge', { hasText: 'Approved' }).first()).toBeVisible();
  await page.getByRole('button', { name: /Edit Section/ }).click();

  // No snapshot/reset dialog for an Editor — the post-approval toast appears instead.
  await expect(page.getByRole('heading', { name: /Edit an approved subsection/ })).toHaveCount(0);
  await expect(page.getByText(/post-approval/i).first()).toBeVisible();
});

test('non-Editor (Input Provider) editing an approved section snapshots + resets to Draft', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();

  await page.locator('.section-tree').getByText('Front Cover').first().click();
  await expect(page.locator('.status-badge', { hasText: 'Approved' }).first()).toBeVisible();

  // View as the Input Provider (a non-editor) — for them, re-editing an approved
  // subsection still snapshots a version and resets to Draft for re-approval.
  await page.locator('.view-header select').selectOption('input_provider');
  await page.getByRole('button', { name: /Edit Section/ }).click();
  await expect(page.getByRole('heading', { name: /Edit an approved subsection/ })).toBeVisible();
  await page.getByRole('button', { name: /Snapshot & edit/ }).click();
  await expect(page.getByText(/reset to Draft for re-approval/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Versions \(1\)/ })).toBeVisible();
});

test('a saved edit is captured as a version and the diff viewer shows a redline', async ({ page }) => {
  await openClimatePolicies(page); // 8.1.2 Climate → Policies (starts in review, editable)

  // Edit the content and save with a reason — this should freeze an 'Edited' version.
  await page.getByRole('button', { name: /Edit Section/ }).click();
  if (await page.getByRole('heading', { name: /Edit an approved subsection/ }).count()) {
    await page.getByRole('button', { name: /Snapshot & edit/ }).click();
  }
  await expect(page.locator('.rte-surface')).toBeVisible();
  await page.locator('.rte-surface').click();
  await page.keyboard.type(' Additional FY2026 assurance note appended for the diff test.');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.getByPlaceholder(/Updated Scope 3 figures/).fill('E2E: appended assurance note');
  await page.getByRole('button', { name: 'Save with Reason' }).click();
  await expect(page.getByText(/change\(s\) tracked/)).toBeVisible();

  // Open the version history & compare modal.
  await page.getByRole('button', { name: /Versions \(/ }).click();
  await expect(page.getByRole('heading', { name: /Version history & compare/ })).toBeVisible();

  // The saved edit appears as an "Edited" version in the timeline (accent chip),
  // and the redline highlights the added sentence (frozen version → current draft).
  await expect(page.locator('.modal-content').getByText('Timeline (1)')).toBeVisible();
  await expect(page.locator('.redline-add').first()).toBeVisible();
});

test('L2 consolidated view opens and shows section-level sign-off gate', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();

  // Click the "Climate change" L2 sub-topic header (⧉) to open the consolidated view.
  await page.locator('.section-tree').getByText('Climate change', { exact: true }).first().click();
  await expect(page.locator('.app-content').getByText(/consolidated section/i).first()).toBeVisible();

  // The L2 sign-off gate is shown, keyed to "updated" progress.
  await expect(page.getByText(/Subsections updated:/)).toBeVisible();
  await expect(page.getByText(/Owner sign-off \(L2\):/)).toBeVisible();

  // The L2 owners are named up front, even before the section unlocks — not just
  // after they sign. Climate has a legal owner, so the copy explains the split rule.
  await expect(page.getByText(/at least one Legal\/Compliance owner|all \d+ owners? have signed off/i)).toBeVisible();
});

test('Owner L2 sign-off propagates to subsection + sidebar status', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();

  // "Pollution of water" is seeded with all its subsections marked "updated", so
  // the L2 Owner sign-off is the only remaining step. Open the consolidated view.
  await page.locator('.section-tree').getByText('Pollution of water', { exact: true }).first().click();
  await expect(page.getByText(/Subsections updated:/)).toBeVisible();

  // Before Owner sign-off, a subsection reads "Updated — ready for Owners".
  await page.locator('.section-tree button', { hasText: '8.2.1' }).click();
  await expect(page.locator('.status-badge', { hasText: /Updated/ }).first()).toBeVisible();

  // Sign off as the first Owner from the consolidated section view.
  await page.locator('.section-tree').getByText('Pollution of water', { exact: true }).first().click();
  await viewAs(page, 'owner');
  await page.getByRole('button', { name: /Sign off as / }).click();

  // The Owner sign-off must now propagate to the subsection badge (this L2 group
  // has two owners, so one signature → "Owner signed", awaiting the other owner).
  await page.locator('.section-tree button', { hasText: '8.2.1' }).click();
  await expect(page.locator('.status-badge', { hasText: /Owner signed/ }).first()).toBeVisible();
});

test('AI roll-forward: single acceptance point, no purple highlighting, gates sign-off', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();

  // 8.1.3 (Climate strategy and roadmap) was rolled forward from FY2025 by the AI.
  await page.locator('.section-tree button', { hasText: '8.1.3' }).click();

  // AI governance is now a single acceptance point (13 Jul 2026 feedback #4), not
  // per-paragraph purple highlighting.
  await expect(page.getByRole('button', { name: /Accept AI draft as working base/ })).toBeVisible();
  // No purple AI highlighting in the clean view (feedback #3).
  await expect(page.locator('.ai-generated')).toHaveCount(0);

  // As the Editor, "Mark as updated" is blocked until the AI draft is accepted.
  await viewAs(page, 'editor');
  const markUpdated = page.getByRole('button', { name: /Mark as updated/ });
  await expect(markUpdated).toBeDisabled();

  // Accept the AI draft as the working base → the banner clears and the action unlocks.
  await page.getByRole('button', { name: /Accept AI draft as working base/ }).click();
  await expect(page.getByRole('button', { name: /Accept AI draft as working base/ })).toHaveCount(0);
  await expect(markUpdated).toBeEnabled();
});

test('footnotes render as a numbered list and marker (not raw [^ ] text)', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  // 8.1.3 has a seeded footnote on the shadow carbon price.
  await page.locator('.section-tree button', { hasText: '8.1.3' }).click();
  // A Footnotes section is rendered and the raw "[^" marker is not shown as text.
  await expect(page.locator('.app-content').getByText('Footnotes', { exact: true })).toBeVisible();
  await expect(page.locator('.app-content').getByText(/shadow carbon price is an internal planning value/)).toBeVisible();
  await expect(page.locator('.app-content').getByText(/\[\^/)).toHaveCount(0);
});

test('roll-forward is a click-through list with confirm/update/flag per item', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  // 8.1.3 has seeded roll-forward items.
  await page.locator('.section-tree button', { hasText: '8.1.3' }).click();
  await openCard(page, 'Roll-forward summary'); // checklist moved into this collapsed card
  const rf = page.locator('.rollforward-checklist');
  await expect(rf.getByText(/Year-on-year roll-forward review/)).toBeVisible();
  await expect(rf.getByText(/0\/3 addressed/)).toBeVisible();
  // Confirm the first item → progress advances.
  await rf.getByRole('button', { name: 'Confirm' }).first().click();
  await expect(rf.getByText(/1\/3 addressed/)).toBeVisible();
  await expect(rf.getByText('Confirmed').first()).toBeVisible();
});

// #4 (Adrian 2026-07-15): flagging a roll-forward item highlights its text PINK
// in the editor content so "data not available yet" items are easy to spot.
test('flagging a roll-forward item highlights its snippet pink in the editor', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  await page.locator('.section-tree button', { hasText: '8.1.3' }).click();
  await openCard(page, 'Roll-forward summary');
  const rf = page.locator('.rollforward-checklist');
  // Flag the first item.
  await rf.getByRole('button', { name: 'Flag' }).first().click();
  await expect(rf.getByText('Flagged').first()).toBeVisible();
  // Its snippet is now highlighted with a <mark> in the rendered content.
  const mark = page.locator('.app-content mark[title*="Flagged for roll-forward"]');
  await expect(mark.first()).toBeVisible();
});

// 2026-07-15 fix — a read-only Guest seat must NOT be able to confirm/update/flag
// roll-forward items (previously the buttons were ungated).
test('roll-forward is read-only for a Guest seat (no confirm/update/flag)', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  await page.locator('.section-tree button', { hasText: '8.1.3' }).click();
  await viewAs(page, 'guest');
  await openCard(page, 'Roll-forward summary');
  const rf = page.locator('.rollforward-checklist');
  await expect(rf.getByText(/Read-only/i)).toBeVisible();
  await expect(rf.getByRole('button', { name: 'Confirm' })).toHaveCount(0);
  await expect(rf.getByRole('button', { name: 'Update' })).toHaveCount(0);
  await expect(rf.getByRole('button', { name: 'Flag' })).toHaveCount(0);
});

// 2026-07-15 — datapoint chips carry a coverage-status dot that deep-links to the
// Analysis page focused on that DR (filtered, expanded, requirement text open).
// 2026-07-15: a datapoint chip opens a single "View details" POPUP (coverage +
// rationale + requirement text) in place — no navigation to the Analysis page.
test('datapoint chip opens a details popup in place (no page navigation)', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  // 8.1.3 carries assigned datapoints (ESRS-E1-1, ISSB-S2-33 etc.).
  await page.locator('.section-tree button', { hasText: '8.1.3' }).click();
  await expect(page.getByText(/Datapoints assigned to this section/)).toBeVisible();
  // Clicking the chip opens the popup; the URL stays on /editor.
  await page.getByRole('button', { name: /^ESRS-E1-1/ }).first().click();
  await expect(page.locator('.modal-content')).toBeVisible();
  await expect(page.locator('.modal-content')).toContainText(/Coverage/);
  await expect(page).toHaveURL(/\/editor/);
});

// A subsection with NO assigned datapoints shows an explicit note (not a blank).
test('a section with no datapoints shows a "none assigned yet" note', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  // 7.2.2 (Research and development) has no assigned datapoints.
  await page.locator('.section-tree button', { hasText: '7.2.2' }).click();
  await expect(page.getByText(/Datapoints assigned to this section/)).toBeVisible();
  await expect(page.getByText(/No datapoints assigned to this subsection yet/)).toBeVisible();
});

test('Word/MDD export is available any time — draft when not all approved', async ({ page }) => {
  // Export policy (customer update 2026-08-21): DOCX/PDF can be generated at any
  // time by anyone except the read-only Guest. Before every subsection is
  // Approved the export is a clearly-marked DRAFT, but it is NOT blocked.
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  // Not-all-approved → draft notice shown, and the DOCX button is enabled (draft).
  await expect(page.getByText(/Draft export/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Word (MDD) — draft/ })).toBeEnabled();
});

test('default Admin (ESG Lead) seat can resolve a request without switching role', async ({ page }) => {
  await openClimatePolicies(page);
  await openCard(page, 'Comments & notes');
  const panel = page.locator('.comments-panel');
  // Raise a request while on the default Admin seat (the logged-in ESG Lead).
  await panel.locator('select').selectOption('request');
  await panel.getByPlaceholder(/Describe the change/).fill('E2E: me-seat request should be resolvable.');
  await panel.getByRole('button', { name: 'Raise request' }).click();
  // The Editor resolve controls must be available WITHOUT switching "View as".
  await expect(panel.getByText(/Assign to Editor\/Admin/).first()).toBeVisible();
  await panel.getByRole('button', { name: /^Me \(/ }).first().click();
  await expect(panel.getByText(/AI RECOMMENDATION/)).toBeVisible();
});

test('comment-only role raises a request; Editor gets AI recommendation and resolves', async ({ page }) => {
  await openClimatePolicies(page); // 8.1.2 Climate → Policies
  await openCard(page, 'Comments & notes');
  const panel = page.locator('.comments-panel');
  await expect(panel).toBeVisible();

  // Raise a change request as a comment-only seat (Guest — read-only + comment).
  await viewAs(page, 'guest');
  await panel.locator('select').selectOption('request');
  await panel.getByPlaceholder(/Describe the change/).fill('E2E: please add prior-year comparison and assurance scope.');
  await panel.getByRole('button', { name: 'Raise request' }).click();
  await expect(panel.getByText(/E2E: please add prior-year comparison/)).toBeVisible();

  // As an Editor, assign it (which generates the AI recommendation). The request
  // actions are now Resolved / Dismiss / Send back (Adrian 2026-08-31).
  await viewAs(page, 'editor');
  await panel.getByRole('button', { name: /^Me \(/ }).first().click();
  await expect(panel.getByText(/AI RECOMMENDATION/)).toBeVisible();
  await expect(panel.getByRole('button', { name: /Send back/ })).toBeVisible();
  await panel.getByRole('button', { name: /Resolved/ }).click();

  // Resolving applies the suggestion as a pending tracked change and closes it.
  await expect(page.getByText(/applied as a pending tracked change/)).toBeVisible();
  await expect(panel.getByText(/Editor resolved and applied the suggestion/)).toBeVisible();
});
