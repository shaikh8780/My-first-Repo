import { describe, it, expect } from 'vitest';
import { getPortfolioSummary, getMyTasks, portfolioOwners } from './portfolio';
import { reports } from './reports';

describe('portfolio aggregation', () => {
  it('summarises every registered report exactly once', () => {
    const s = getPortfolioSummary();
    expect(s.rows).toHaveLength(reports.length);
    expect(new Set(s.rows.map(r => r.def.id)).size).toBe(reports.length);
  });

  it('derives progress/coverage/flags within valid ranges', () => {
    for (const r of getPortfolioSummary().rows) {
      expect(r.progressPercent).toBeGreaterThanOrEqual(0);
      expect(r.progressPercent).toBeLessThanOrEqual(100);
      expect(r.coveragePercent).toBeGreaterThanOrEqual(0);
      expect(r.coveragePercent).toBeLessThanOrEqual(100);
      expect(r.openFlags).toBeGreaterThanOrEqual(r.failFlags);
      expect(r.total).toBeGreaterThan(0);
    }
  });

  it('totals reflect the row set', () => {
    const s = getPortfolioSummary();
    expect(s.totals.reports).toBe(s.rows.length);
    expect(s.totals.sections).toBe(s.rows.reduce((n, r) => n + r.total, 0));
  });

  it('getMyTasks returns only actionable (not approved/exported) sections', () => {
    const { tasks } = getMyTasks('sam.delgado');
    expect(tasks.length).toBeGreaterThan(0);
    for (const t of tasks) {
      expect(['draft', 'sme_review', 'legal_review']).toContain(t.stage);
    }
  });

  it('matches a signed-in alias to the seeded owner (filtered, not unfiltered)', () => {
    const res = getMyTasks('sam.delgado');
    expect(res.unfiltered).toBe(false);
    // Sam Delgado owns environmental/climate content across reports.
    expect(res.tasks.every(t => t.owner === 'Sam Delgado')).toBe(true);
    // spans more than one report (ESG Index + climate reports)
    expect(new Set(res.tasks.map(t => t.reportId)).size).toBeGreaterThan(1);
  });

  it('falls back to the full open queue for an unknown user, flagged unfiltered', () => {
    const res = getMyTasks('nobody.unknown');
    expect(res.unfiltered).toBe(true);
    expect(res.tasks.length).toBeGreaterThan(0);
  });

  it('parallel reports have varied (not single hardcoded) owners', () => {
    const owners = portfolioOwners();
    expect(owners.length).toBeGreaterThan(3);
    expect(owners).toContain('Sam Delgado');
  });
});
