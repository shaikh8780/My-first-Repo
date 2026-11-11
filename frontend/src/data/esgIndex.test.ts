import { describe, it, expect } from 'vitest';
import { esgIndexCategories, esgIndexTopicsFlat, esgIndexTopicCount, esgIndexIntro } from './esgIndex';
import { getReport } from './reports';

describe('ESG Index data', () => {
  it('has the 5 categories from Adrian’s brief', () => {
    expect(esgIndexCategories.map(c => c.title)).toEqual([
      'Environment', 'People', 'Innovation and access', 'Quality and supply', 'Governance',
    ]);
  });

  it('has 37 topics total, matching the flat list and count', () => {
    const total = esgIndexCategories.reduce((n, c) => n + c.topics.length, 0);
    expect(total).toBe(37);
    expect(esgIndexTopicsFlat).toHaveLength(37);
    expect(esgIndexTopicCount).toBe(37);
  });

  it('keeps the body-authoritative Governance topics (10, incl. Business ethics)', () => {
    const gov = esgIndexCategories.find(c => c.title === 'Governance')!;
    expect(gov.topics).toHaveLength(10);
    expect(gov.topics.map(t => t.title)).toContain('Business ethics');
  });

  it('every topic has a narrative and at least one relevant link', () => {
    for (const cat of esgIndexCategories) {
      for (const t of cat.topics) {
        expect(t.narrative.length).toBeGreaterThan(20);
        expect(t.links.length).toBeGreaterThan(0);
      }
    }
  });

  it('every link URL (when present) is an absolute https URL', () => {
    const allLinks = [
      ...esgIndexIntro.publications,
      ...esgIndexCategories.flatMap(c => c.topics.flatMap(t => t.links)),
    ];
    for (const l of allLinks) {
      if (l.url) expect(l.url).toMatch(/^https:\/\//);
    }
  });

  it('the report registry esg-index entry reflects the 37-topic structure', () => {
    const def = getReport('esg-index');
    expect(def.subsectionCount).toBe(37);
    expect(def.structure).toHaveLength(37);
  });
});
