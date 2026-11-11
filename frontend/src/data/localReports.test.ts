import { describe, it, expect } from 'vitest';
import { localReportStructure, localStructureFlat, tcfdUkSubsectionCount, issbAuSubsectionCount } from './localReports';
import { getReport } from './reports';

describe('Local climate reports (ISSB AU + TCFD UK)', () => {
  it('follows Adrian’s A–E TCFD structure', () => {
    expect(localReportStructure.map(s => `${s.ref}. ${s.title}`)).toEqual([
      'A. Introduction',
      'B. Governance',
      'C. Strategy',
      'D. Risk management',
      'E. Metrics and targets',
    ]);
  });

  it('has the required TCFD governance and strategy subsections', () => {
    const gov = localReportStructure.find(s => s.ref === 'B')!;
    expect(gov.subsections.map(s => s.ref)).toEqual(expect.arrayContaining(['B.1', 'B.2', 'B.3']));
    const strat = localReportStructure.find(s => s.ref === 'C')!;
    expect(strat.subsections.map(s => s.ref)).toEqual(expect.arrayContaining(['C.1', 'C.2', 'C.3', 'C.4', 'C.5']));
  });

  it('ISSB report includes MORE requirements than the TCFD report', () => {
    expect(issbAuSubsectionCount).toBeGreaterThan(tcfdUkSubsectionCount);
    const issbOnlyCount = localReportStructure
      .flatMap(s => s.subsections)
      .filter(s => s.issbOnly).length;
    expect(issbAuSubsectionCount - tcfdUkSubsectionCount).toBe(issbOnlyCount);
    expect(issbOnlyCount).toBeGreaterThan(0);
  });

  it('the UK TCFD structure carries no ISSB-only rows', () => {
    const ukRefs = new Set(localStructureFlat(false).map(s => s.ref));
    const issbOnlyRefs = localReportStructure.flatMap(s => s.subsections).filter(s => s.issbOnly).map(s => s.ref);
    for (const ref of issbOnlyRefs) expect(ukRefs.has(ref)).toBe(false);
  });

  it('both reports are registered and share the same top-level structure', () => {
    const au = getReport('asrs');
    const uk = getReport('tcfd-uk');
    expect(au.subsectionCount).toBe(issbAuSubsectionCount);
    expect(uk.subsectionCount).toBe(tcfdUkSubsectionCount);
    // Both cross-reference the RNFM Climate change section (shared content).
    expect(au.crossReferences.some(x => x.toReportSection.includes('8.1'))).toBe(true);
    expect(uk.crossReferences.some(x => x.toReportSection.includes('8.1'))).toBe(true);
  });
});
