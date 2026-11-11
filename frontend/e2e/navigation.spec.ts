import { test, expect } from '@playwright/test';

// Every nav tab loads its view at its own URL and renders the expected heading.
// Titles verified against each view component.
// Compliance / Consistency / Peer benchmarking are no longer standalone nav
// items — they are tabs inside "Analysis" (covered by the Analysis test below).
const TABS: { label: string; path: string; heading: RegExp }[] = [
  { label: 'Home', path: '/', heading: /Home/ },
  { label: 'Dashboard', path: '/dashboard', heading: /Dashboard/ },
  { label: 'Report Editor', path: '/editor', heading: /Report Editor/ },
  { label: 'Analysis', path: '/analysis', heading: /Analysis/ },
  { label: 'Section Structure', path: '/structure', heading: /Section Structure|structure/i },
  { label: 'Knowledge Base', path: '/knowledgebase', heading: /Knowledge Base/ },
  { label: 'Policy Inventory', path: '/policies', heading: /Policy Inventory/ },
  { label: 'Audit Trail', path: '/audit', heading: /Audit Trail/ },
  { label: 'Upload Documents', path: '/upload', heading: /Upload/ },
  { label: 'Previous Reports', path: '/reports', heading: /Previous Reports/ },
  { label: 'User Guide', path: '/guide', heading: /User Guide/ },
  { label: 'Architecture', path: '/architecture', heading: /Architecture/ },
  { label: 'AI Suggestions', path: '/suggestions', heading: /AI-Augmented|AI Suggestions/i },
  { label: 'Demo', path: '/demo', heading: /Demo/ },
];

test.describe('navigation: every tab renders at its own URL', () => {
  for (const tab of TABS) {
    test(`click "${tab.label}" -> ${tab.path}`, async ({ page }) => {
      await page.goto('/');
      await expect(page.getByText('ESG Authoring Studio')).toBeVisible();
      await page.getByRole('button', { name: new RegExp(tab.label) }).click();
      const expectedUrl = tab.path === '/' ? /\/$/ : new RegExp(`${tab.path}$`);
      await expect(page).toHaveURL(expectedUrl);
      await expect(page.getByRole('heading', { name: tab.heading }).first()).toBeVisible();
    });
  }
});

test('deep-link directly to a tab (SPA routing) works', async ({ page }) => {
  for (const path of ['/editor', '/compliance', '/structure', '/audit']) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByText('ESG Authoring Studio')).toBeVisible();
  }
});

test('analysis: merges compliance, consistency and peer benchmarking as tabs', async ({ page }) => {
  await page.goto('/analysis');
  await expect(page.getByRole('heading', { name: /Analysis/ }).first()).toBeVisible();
  // Compliance is the default tab — its controls render (the child's own H1 is
  // hidden inside the merged view, so assert on a visible control instead).
  await expect(page.getByRole('button', { name: /Run Scan/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'By Standard' })).toBeVisible();
  // Switch to Consistency Check tab.
  await page.getByRole('button', { name: 'Consistency Check' }).click();
  await expect(page).toHaveURL(/\/consistency$/);
  await expect(page.getByRole('button', { name: /Run Consistency Check/ })).toBeVisible();
  // Switch to Peer Benchmarking tab.
  await page.getByRole('button', { name: 'Peer Benchmarking' }).click();
  await expect(page).toHaveURL(/\/benchmarking$/);
  // Back to Compliance.
  await page.getByRole('button', { name: 'Compliance', exact: true }).click();
  await expect(page).toHaveURL(/\/analysis$/);
});

test('demo page: "Why & How" toggle reveals the customer Q&A reference', async ({ page }) => {
  await page.goto('/demo');
  // Default tab is now "Try new features" (added 2026-08-31); the step-by-step
  // script with its Talking Points lives under the "Demo Script" tab.
  await page.getByRole('button', { name: 'Demo Script' }).click();
  await expect(page.getByText('Talking Points')).toBeVisible();
  // Switch to the Why & How reference.
  await page.getByRole('button', { name: /Why.*How/ }).click();
  // Default category ("Why we built this") is shown.
  await expect(page.getByRole('heading', { name: /Why we built this/ })).toBeVisible();
  await expect(page.getByText(/Why does Novartis need this/)).toBeVisible();
  // Selecting another topic swaps the answers shown.
  await page.getByRole('button', { name: /How the AI works/ }).click();
  await expect(page.getByText(/How do we know the AI is not hallucinating/)).toBeVisible();
});

test('admin: panel opens with its tabs (admin user)', async ({ page }) => {
  // The E2E bypass identity (jordanavery) is an admin, so /admin renders the panel.
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible();
  // Exact match: 'Knowledge Base' also appears as a left-nav item.
  await expect(page.getByRole('button', { name: 'AI Tuning', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Verification & Validation', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'AI Tuning', exact: true }).click();
  await expect(page.getByText('App-wide context')).toBeVisible();
});

test('no console errors while visiting the core views', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  for (const path of ['/', '/editor', '/compliance', '/structure', '/knowledgebase', '/audit', '/reports']) {
    await page.goto(path);
    await page.waitForTimeout(400);
  }
  // Allow benign network/font noise; fail on real JS errors.
  const real = errors.filter(e => !/favicon|font|net::|Failed to load resource/i.test(e));
  expect(real, `unexpected console errors:\n${real.join('\n')}`).toHaveLength(0);
});
