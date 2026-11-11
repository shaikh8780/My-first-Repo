import { describe, it, expect } from 'vitest';
import { localAdapter } from './LocalAdapter';
import { restAdapter } from './RestAdapter';

// Contract test: the two adapters MUST expose the same port surface, or a call
// site that works on one silently breaks when VITE_API_MODE flips. This guards
// against drift — if someone adds a port to one adapter (or a Doc method) they
// must add it to both, and this test forces that.

// The Doc<T> methods every document-shaped port must implement.
const DOC_METHODS = ['get', 'set', 'clear'] as const;

function docShape(d: unknown): string[] {
  return DOC_METHODS.filter(m => typeof (d as Record<string, unknown>)?.[m] === 'function');
}

describe('Local/Rest adapter contract', () => {
  it('top-level Api keys match', () => {
    expect(Object.keys(localAdapter).sort()).toEqual(Object.keys(restAdapter).sort());
  });

  it('report channel keys match', () => {
    expect(Object.keys(localAdapter.report).sort()).toEqual(Object.keys(restAdapter.report).sort());
  });

  it('structure channel keys match', () => {
    expect(Object.keys(localAdapter.structure).sort()).toEqual(Object.keys(restAdapter.structure).sort());
  });

  it('every report Doc exposes get/set/clear on both adapters', () => {
    for (const key of Object.keys(localAdapter.report)) {
      const l = (localAdapter.report as unknown as Record<string, unknown>)[key];
      const r = (restAdapter.report as unknown as Record<string, unknown>)[key];
      // Skip non-Doc members (trackedDrafts is a keyed API; reset is a function).
      if (key === 'trackedDrafts' || key === 'reset') continue;
      expect(docShape(l), `local ${key}`).toEqual([...DOC_METHODS]);
      expect(docShape(r), `rest ${key}`).toEqual([...DOC_METHODS]);
    }
  });

  it('trackedDrafts + reset shapes match on both adapters', () => {
    for (const a of [localAdapter, restAdapter]) {
      expect(typeof a.report.reset).toBe('function');
      expect(typeof a.report.trackedDrafts.get).toBe('function');
      expect(typeof a.report.trackedDrafts.set).toBe('function');
      expect(typeof a.report.trackedDrafts.remove).toBe('function');
      expect(typeof a.report.trackedDrafts.clearAll).toBe('function');
    }
  });
});
