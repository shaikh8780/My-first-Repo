import { test, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'shots-roles');
fs.mkdirSync(OUT, { recursive: true });

test.use({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 2 });

// r17 — the Admin "Directory (AD / SSO)" tab: flow seam + capability/assignment
// + group→role mapping (top of the tab). r18 — the directory user table + a
// token-claim inspector open, showing group→role resolution end to end.
test('r17/r18: AD directory simulation tab', async ({ page }) => {
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Directory (AD / SSO)' }).click();
  await page.waitForTimeout(500);
  // r17 — top of the tab (seam + capability/assignment + group mapping).
  // Full viewport (incl. sidebar) so no card text is clipped — matches the
  // other full-screen shots in the deck.
  await page.screenshot({ path: path.join(OUT, 'r17-ad-directory.png'), fullPage: false });

  // r18 — open a multi-group user's claim inspector (Sam Delgado: Owner+Contributor).
  await page.getByText('Sam Delgado', { exact: true }).first().click();
  await page.waitForTimeout(400);
  await page.locator('.card', { hasText: /Token claim/ }).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.locator('.card', { hasText: /Token claim/ }).first().screenshot({ path: path.join(OUT, 'r18-ad-claim.png') });
});
