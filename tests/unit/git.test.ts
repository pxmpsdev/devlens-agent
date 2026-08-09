import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeGit, enrichHotspotsWithComplexity, buildComplexityMap } from '../../src/analyzer/git/index.js';

// We don't test the full git integration in unit tests since it requires a real repo.
// Instead we test the data transformation functions.

describe('buildComplexityMap', () => {
  it('builds a complexity map from entries', () => {
    const entries = [
      { file: 'a.ts', complexity: 5 },
      { file: 'a.ts', complexity: 3 },
      { file: 'b.ts', complexity: 10 },
    ];

    const map = buildComplexityMap(entries);
    expect(map.get('a.ts')).toBe(8);
    expect(map.get('b.ts')).toBe(10);
  });

  it('returns empty map for empty entries', () => {
    const map = buildComplexityMap([]);
    expect(map.size).toBe(0);
  });
});

describe('enrichHotspotsWithComplexity', () => {
  it('enriches hotspots with complexity and risk scores', () => {
    const hotspots = [
      { file: 'a.ts', changes: 50, complexity: 0, riskScore: 0 },
      { file: 'b.ts', changes: 10, complexity: 0, riskScore: 0 },
    ];

    const complexityMap = new Map([
      ['a.ts', 25],
      ['b.ts', 5],
    ]);

    const enriched = enrichHotspotsWithComplexity(hotspots, complexityMap, 5);
    expect(enriched.length).toBeGreaterThan(0);
    expect(enriched[0]!.file).toBe('a.ts');
    expect(enriched[0]!.complexity).toBe(25);
    expect(enriched[0]!.riskScore).toBeGreaterThan(0);
  });

  it('filters out hotspots below threshold', () => {
    const hotspots = [
      { file: 'a.ts', changes: 2, complexity: 0, riskScore: 0 },
    ];

    const complexityMap = new Map([['a.ts', 1]]);
    const enriched = enrichHotspotsWithComplexity(hotspots, complexityMap, 10);
    expect(enriched.length).toBe(1);
  });

  it('sorts by risk score descending', () => {
    const hotspots = [
      { file: 'low.ts', changes: 5, complexity: 0, riskScore: 0 },
      { file: 'high.ts', changes: 100, complexity: 0, riskScore: 0 },
    ];

    const complexityMap = new Map([
      ['low.ts', 5],
      ['high.ts', 30],
    ]);

    const enriched = enrichHotspotsWithComplexity(hotspots, complexityMap, 0);
    expect(enriched[0]!.file).toBe('high.ts');
  });
});
