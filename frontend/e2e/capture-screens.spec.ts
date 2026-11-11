import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Not a real test — a capture harness. Run with:
//   VITE_E2E_AUTH_BYPASS=true npx playwright test capture-screens --project=chromium
// It walks the studio and writes full-page PNGs into e2e/shots/, which the
// deck-build script then assembles into the customer walkthrough PowerPoint.
// Uses the same auth-bypass webServer as the smoke tests.

const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

// A generous desktop viewport so captures look like a real screen, not a phone.
// deviceScaleFactor: 2 renders at 2x pixel density so text stays crisp when the
// image is scaled onto a slide.
test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

// Screenshots here feed a slide deck, where each image is scaled to fit a 16:9
// slide. A full-page capture of a tall screen (dashboard, editor, long modal)
// becomes a very tall image that scales down to an unreadable sliver on a slide.
// So we capture at VIEWPORT height by default ("above the fold"): a consistent
// ~1.6 aspect that fills the slide region and stays legible. The top of each
// screen is the important part; captions note where a list continues below.
async function shot(page: import('@playwright/test').Page, name: string) {
  await page.waitForTimeout(500); // let transitions/charts settle
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
}

// Alias kept for the list-heavy screens that were already switched over — same
// viewport-clip behaviour, clearer intent at the call site.
async function shotView(page: import('@playwright/test').Page, name: string) {
  await shot(page, name);
}

test('capture: walkthrough screens', async ({ page }) => {
  // 1. Dashboard
  await page.goto('/dashboard');
  await expect(page.getByText('ESG Authoring Studio')).toBeVisible();
  await page.waitForTimeout(700);
  await shot(page, '01-dashboard');

  // 2. Knowledge Base — list-heavy, capture just the top rows so it stays legible
  await page.goto('/knowledgebase');
  await expect(page.getByRole('heading', { name: /Knowledge Base/ }).first()).toBeVisible();
  await shotView(page, '02-knowledge-base');

  // 3. Report Editor — a real subsection with content + prior-year panel
  await page.goto('/editor');
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  await page.locator('.section-tree button', { hasText: '8.1.2' }).click();
  await page.waitForTimeout(400);
  await shot(page, '03-editor-section');

  // 3b. Editor view — full-section inline redline (Editor role sees tracked changes)
  const acceptBtn = page.getByRole('button', { name: /Accept AI draft as working base/ });
  if (await acceptBtn.isVisible().catch(() => false)) await acceptBtn.click();
  const editorTab = page.getByRole('button', { name: /Editor view/ });
  if (await editorTab.isVisible().catch(() => false)) {
    await editorTab.click();
    await page.waitForTimeout(400);
    await shot(page, '04-editor-tracked-changes');
  }

  // 4. Compliance / 2027 ESRS readiness
  await page.goto('/compliance');
  await expect(page.getByRole('heading', { name: /Analysis/ }).first()).toBeVisible();
  await shot(page, '05-compliance');

  // 5. Consistency check — list-heavy, show the top checks legibly
  await page.goto('/consistency');
  await expect(page.getByRole('heading', { name: /Consistency Check/ }).first()).toBeVisible();
  await shotView(page, '06-consistency');

  // 6. Peer benchmarking
  await page.goto('/benchmarking');
  await expect(page.getByRole('heading', { name: /Peer Benchmarking/ }).first()).toBeVisible();
  await shot(page, '07-benchmarking');

  // 7. Audit trail — append-only log is long; show the most recent entries legibly
  await page.goto('/audit');
  await expect(page.getByRole('heading', { name: /Audit Trail/ }).first()).toBeVisible();
  await shotView(page, '08-audit');

  // 8. Approval workflow — open the workflow card on a section so the stepper shows
  await page.goto('/editor');
  await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  await page.locator('.section-tree button', { hasText: '8.2.1' }).click();
  await page.waitForTimeout(300);
  const wfCard = page.getByText('Approval workflow', { exact: true });
  if (await wfCard.isVisible().catch(() => false)) {
    await wfCard.click();
    await page.waitForTimeout(400);
  }
  await shot(page, '09-approval-workflow');

  // 9. Structure admin
  await page.goto('/structure');
  await page.waitForTimeout(500);
  await shot(page, '10-structure');
});

// ---------------------------------------------------------------------------
// New-capability captures (2026-07 updates). Separate test so it can run/refresh
// independently; higher-DPI for crisp deck images.
// ---------------------------------------------------------------------------
test.describe('new capability screens', () => {
  test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  async function reset(page: import('@playwright/test').Page) {
    await page.getByRole('button', { name: 'Reset Demo' }).click();
    await expect(page.getByText(/\d+ subsections/)).toBeVisible();
  }
  async function openSection(page: import('@playwright/test').Page, ref: string) {
    await page.locator('.section-tree button', { hasText: ref }).click();
    await page.waitForTimeout(300);
  }

  test('capture: new screens', async ({ page }) => {
    // 11. Datapoints assigned + details popup (single "View details").
    await page.goto('/editor');
    await reset(page);
    await openSection(page, '8.1.3');
    await page.getByRole('button', { name: /^ESRS-E1-1/ }).first().click();
    await page.waitForTimeout(400);
    await shot(page, '11-datapoint-details');
    await page.locator('.modal-content').getByRole('button', { name: '✕' }).click();

    // 12. Datapoint "none assigned yet" note (7.2.2 has no datapoints).
    await openSection(page, '7.2.2');
    await shot(page, '12-datapoints-none');

    // 13. Evidence & sources card. It sits below the fold, so scroll it to the
    // top before the viewport capture so the card (not the header above it) is
    // what's framed.
    await openSection(page, '9.1.1');
    const evCard = page.locator('.collapsible-card-header', { hasText: 'Evidence & sources' }).first();
    if ((await evCard.getAttribute('aria-expanded')) !== 'true') await evCard.click();
    await evCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await shot(page, '13-evidence');

    // 14. Export screen (PDF + DOCX).
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await page.waitForTimeout(300);
    await shot(page, '14-export');
    await page.locator('.modal-content').getByRole('button', { name: '✕' }).click();

    // 15. Dashboard role switch ("View tasks as").
    await page.goto('/dashboard');
    await page.waitForTimeout(500);
    await shot(page, '15-dashboard-role-switch');

    // 16. Compliance datapoint gap detail (why partial + suggested fill).
    // Clicking the row expands an inline detail panel; scroll the row to the top
    // so the viewport capture frames the detail rather than the filters above it.
    await page.goto('/compliance');
    await page.getByRole('button', { name: 'Gap Analysis' }).click();
    await page.getByRole('button', { name: 'Partial', exact: true }).click();
    const gapRow = page.locator('table tbody tr').first();
    await gapRow.click();
    await gapRow.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await shot(page, '16-compliance-gap-detail');

    // 17. Demo page "Roles & Updates" reference.
    await page.goto('/demo');
    await page.getByRole('button', { name: /Roles & Updates/ }).click();
    await page.waitForTimeout(400);
    await shot(page, '17-roles-updates');
  });

  // Track-changes engine screens (behind the flag — enable via URL).
  test('capture: track-changes screens', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ff:trackChangesEngine', 'true'));

    // 18. Change-by-change AI roll-forward (8.1.3 is rolled forward).
    await page.goto('/editor');
    await reset(page);
    await openSection(page, '8.1.3');
    const et = page.getByRole('button', { name: /Editor view/ });
    if (await et.count()) await et.click();
    await page.waitForTimeout(400);
    await shot(page, '18-rollforward-change-by-change');

    // 19. Track-changes editor: type an insertion + the per-change review list + AI box.
    await openSection(page, '8.1.2');
    const acc = page.getByRole('button', { name: /Accept all remaining|Confirm & accept/ });
    if (await acc.count()) await acc.first().click();
    await page.getByRole('button', { name: 'Edit Section' }).click();
    if (await page.getByRole('heading', { name: /Edit an approved subsection/ }).count()) {
      await page.getByRole('button', { name: /Snapshot & edit/ }).click();
    }
    await page.locator('.rte-surface').click();
    await page.keyboard.type(' Our FY2026 interim milestone was independently assured.');
    await page.keyboard.press('Home');
    for (let i = 0; i < 6; i++) await page.keyboard.press('Delete'); // a tracked deletion too
    await page.waitForTimeout(400);
    await shot(page, '19-track-changes-editor');

    // 20. AI chat producing a tracked suggestion.
    const ai = page.locator('.tc-ai');
    await ai.getByPlaceholder(/draft a paragraph|rephrase/i).fill('draft a sentence on our assurance scope');
    await ai.getByRole('button', { name: 'Ask AI' }).click();
    await page.waitForTimeout(400);
    await shot(page, '20-ai-chat-suggestion');
  });

  // Versioning + comparison modal.
  test('capture: versions and compare', async ({ page }) => {
    await page.goto('/editor');
    await reset(page);
    await openSection(page, '8.1.2');
    // Make a saved edit so there is a version to show, then open the modal.
    await page.getByRole('button', { name: 'Edit Section' }).click();
    if (await page.getByRole('heading', { name: /Edit an approved subsection/ }).count()) {
      await page.getByRole('button', { name: /Snapshot & edit/ }).click();
    }
    await page.locator('.rte-surface').click();
    await page.keyboard.type(' Added an assurance note for the version-history capture.');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await page.getByPlaceholder(/Updated Scope 3|FY2026 actuals/).fill('Assurance note added');
    await page.getByRole('button', { name: /Save with Reason/ }).click();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: /Versions \(/ }).click();
    await page.waitForTimeout(400);
    await shot(page, '21-versions-compare');
  });

  // Re-capture the core overview screens at scale 2 (crisper than the original
  // scale-1 01-10) + a few extra views, so the customer gets a consistent,
  // high-res look and feel without demo access.
  test('capture: hi-res core + extra views', async ({ page }) => {
    // 01 Dashboard
    await page.goto('/dashboard');
    await expect(page.getByText('ESG Authoring Studio')).toBeVisible();
    await page.waitForTimeout(700);
    await shot(page, '01-dashboard');

    // 02 Knowledge Base — top rows only (a few example Novartis documents), legible
    await page.goto('/knowledgebase');
    await page.waitForTimeout(500);
    await shotView(page, '02-knowledge-base');

    // 03 Editor section
    await page.goto('/editor');
    await reset(page);
    await openSection(page, '8.1.2');
    await shot(page, '03-editor-section');

    // 05 Compliance / 2027 ESRS readiness
    await page.goto('/compliance');
    await page.waitForTimeout(500);
    await shot(page, '05-compliance');

    // 06 Consistency check — list-heavy, show the top checks legibly
    await page.goto('/consistency');
    await page.waitForTimeout(500);
    await shotView(page, '06-consistency');

    // 07 Peer benchmarking
    await page.goto('/benchmarking');
    await page.waitForTimeout(500);
    await shot(page, '07-benchmarking');

    // 10 Section structure — long tree, show the top of it legibly
    await page.goto('/structure');
    await page.waitForTimeout(500);
    await shotView(page, '10-structure');

    // 22 Compliance by-standard (coverage grid) — long grid, show top rows legibly
    await page.goto('/compliance');
    await page.getByRole('button', { name: 'By Standard' }).click();
    await page.waitForTimeout(400);
    await shotView(page, '22-compliance-by-standard');

    // 23 Comments & notes card on a section
    await page.goto('/editor');
    await reset(page);
    await openSection(page, '8.1.2');
    const cCard = page.locator('.collapsible-card-header', { hasText: 'Comments' }).first();
    if (await cCard.count() && (await cCard.getAttribute('aria-expanded')) !== 'true') await cCard.click();
    await cCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await shot(page, '23-comments');

    // 24 GRI datapoint requirement text (authored from public standard)
    await page.goto('/compliance');
    await page.getByRole('button', { name: 'By Standard' }).click();
    await page.locator('button', { has: page.locator('.framework-badge', { hasText: 'GRI' }) }).first().click().catch(() => {});
    const griLink = page.locator('table button', { hasText: /^GRI-/ }).first();
    if (await griLink.count()) {
      await griLink.click();
      await page.waitForTimeout(400);
      await shot(page, '24-gri-requirement-text');
    }
  });
});
