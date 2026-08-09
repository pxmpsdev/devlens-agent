import { describe, it, expect } from 'vitest';
import { calculateHealthScore } from '../../src/scoring/index.js';
import type { AnalysisMetrics, ScoringWeights } from '../../src/types/index.js';

function createMetrics(overrides: Partial<AnalysisMetrics> = {}): AnalysisMetrics {
  return {
    complexity: {
      average: 5,
      highest: 10,
      highestFile: 'test.ts',
      highComplexityFiles: [],
    },
    duplication: {
      estimatedPercentage: 3,
      duplicateBlockCount: 0,
      totalDuplicateLines: 0,
      duplicates: [],
    },
    fileHealth: {
      files: [],
      averageHealth: 80,
    },
    git: {
      totalCommits: 100,
      totalContributors: 5,
      churnRate: 10,
      hotspots: [],
    },
    ...overrides,
  };
}

const defaultWeights: ScoringWeights = {
  complexity: 0.35,
  duplication: 0.25,
  maintainability: 0.25,
  gitRisk: 0.15,
};

describe('calculateHealthScore', () => {
  it('gives high score for clean project', () => {
    const metrics = createMetrics();
    const result = calculateHealthScore(metrics, defaultWeights);

    expect(result.overall).toBeGreaterThan(80);
    expect(result.grade).toBe('A');
  });

  it('gives lower score for complex project', () => {
    const metrics = createMetrics({
      complexity: {
        average: 20,
        highest: 50,
        highestFile: 'bad.ts',
        highComplexityFiles: [],
      },
      duplication: {
        estimatedPercentage: 15,
        duplicateBlockCount: 10,
        totalDuplicateLines: 100,
        duplicates: [],
      },
    });
    const result = calculateHealthScore(metrics, defaultWeights);

    expect(result.overall).toBeLessThan(80);
  });

  it('returns F for very bad project', () => {
    const metrics = createMetrics({
      complexity: {
        average: 25,
        highest: 60,
        highestFile: 'terrible.ts',
        highComplexityFiles: [],
      },
      duplication: {
        estimatedPercentage: 25,
        duplicateBlockCount: 50,
        totalDuplicateLines: 500,
        duplicates: [],
      },
      fileHealth: {
        files: [],
        averageHealth: 20,
      },
    });
    const result = calculateHealthScore(metrics, defaultWeights);

    expect(result.overall).toBeLessThan(65);
    expect(result.grade === 'D' || result.grade === 'F').toBe(true);
  });

  it('maps grades correctly', () => {
    // Top score should be A
    expect(calculateHealthScore(createMetrics({
      fileHealth: { files: [], averageHealth: 95 },
      complexity: { average: 1, highest: 1, highestFile: '', highComplexityFiles: [] },
      duplication: { estimatedPercentage: 0, duplicateBlockCount: 0, totalDuplicateLines: 0, duplicates: [] },
    }), defaultWeights).grade).toBe('A');
  });

  it('respects custom weights', () => {
    const metrics = createMetrics({
      complexity: {
        average: 20,
        highest: 30,
        highestFile: 'x.ts',
        highComplexityFiles: [],
      },
      fileHealth: {
        files: [],
        averageHealth: 90,
      },
    });

    const heavyComplexity: ScoringWeights = { complexity: 0.9, duplication: 0.05, maintainability: 0.05, gitRisk: 0 };
    const lightComplexity: ScoringWeights = { complexity: 0.05, duplication: 0.04, maintainability: 0.9, gitRisk: 0.01 };

    const heavyResult = calculateHealthScore(metrics, heavyComplexity);
    const lightResult = calculateHealthScore(metrics, lightComplexity);

    // Heavy complexity weight should result in lower score
    expect(heavyResult.overall).toBeLessThan(lightResult.overall);
  });

  it('scores are between 0 and 100', () => {
    const result = calculateHealthScore(createMetrics(), defaultWeights);
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
    expect(result.breakdown.complexity).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.complexity).toBeLessThanOrEqual(100);
    expect(result.breakdown.duplication).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.duplication).toBeLessThanOrEqual(100);
    expect(result.breakdown.maintainability).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.maintainability).toBeLessThanOrEqual(100);
    expect(result.breakdown.gitRisk).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.gitRisk).toBeLessThanOrEqual(100);
  });
});
