import { describe, it, expect } from 'vitest';
import { generateRecommendations } from '../../src/recommendations/index.js';
import { getDefaultConfig } from '../../src/config/defaults.js';
import type { AnalysisMetrics } from '../../src/types/index.js';

const config = getDefaultConfig();

function baseMetrics(): AnalysisMetrics {
  return {
    complexity: {
      average: 3,
      highest: 8,
      highestFile: 'src/app.ts',
      highComplexityFiles: [],
    },
    duplication: {
      estimatedPercentage: 1,
      duplicateBlockCount: 0,
      totalDuplicateLines: 0,
      duplicates: [],
    },
    fileHealth: {
      files: [],
      averageHealth: 90,
    },
    git: {
      totalCommits: 50,
      totalContributors: 3,
      churnRate: 5,
      hotspots: [],
    },
  };
}

describe('generateRecommendations', () => {
  it('generates no recommendations for clean project', () => {
    const result = generateRecommendations(baseMetrics(), config);
    // May still generate "no test files" if no test files found
    const nonTestingRecs = result.filter((r) => r.category !== 'testing');
    expect(nonTestingRecs.length).toBe(0);
  });

  it('generates complexity recommendations for high complexity', () => {
    const metrics: AnalysisMetrics = {
      ...baseMetrics(),
      complexity: {
        average: 10,
        highest: 34,
        highestFile: 'src/auth/login.ts',
        highComplexityFiles: [
          { file: 'src/auth/login.ts', complexity: 34, functionName: 'loginUser', line: 42 },
        ],
      },
    };
    const result = generateRecommendations(metrics, config);
    const complexityRecs = result.filter((r) => r.category === 'complexity');
    expect(complexityRecs.length).toBeGreaterThan(0);
    expect(complexityRecs[0]!.file).toBe('src/auth/login.ts');
    expect(complexityRecs[0]!.line).toBe(42);
    expect(complexityRecs[0]!.title).toContain('loginUser');
  });

  it('generates recommendations for large files', () => {
    const metrics: AnalysisMetrics = {
      ...baseMetrics(),
      fileHealth: {
        files: [
          {
            file: 'src/big.ts',
            lines: 800,
            complexity: 25,
            changes: 10,
            contributors: 2,
            healthScore: 30,
          },
        ],
        averageHealth: 30,
      },
    };
    const result = generateRecommendations(metrics, config);
    const fileRecs = result.filter((r) => r.category === 'maintainability');
    expect(fileRecs.length).toBeGreaterThan(0);
    const bigFileRec = fileRecs.find((r) => r.file === 'src/big.ts');
    expect(bigFileRec).toBeDefined();
  });

  it('generates hotspot recommendations', () => {
    const metrics: AnalysisMetrics = {
      ...baseMetrics(),
      git: {
        totalCommits: 200,
        totalContributors: 5,
        churnRate: 20,
        hotspots: [
          { file: 'src/db/query.ts', changes: 76, complexity: 25, riskScore: 30 },
          { file: 'src/auth/login.ts', changes: 92, complexity: 34, riskScore: 45 },
        ],
      },
    };
    const result = generateRecommendations(metrics, config);
    const hotspotRecs = result.filter(
      (r) => r.category === 'maintainability' && r.file.includes('db/query'),
    );
    expect(hotspotRecs.length).toBeGreaterThan(0);
  });

  it('generates duplication recommendations', () => {
    const metrics: AnalysisMetrics = {
      ...baseMetrics(),
      duplication: {
        estimatedPercentage: 8,
        duplicateBlockCount: 15,
        totalDuplicateLines: 200,
        duplicates: [
          {
            fileA: 'src/a.ts',
            fileB: 'src/b.ts',
            lineStartA: 10,
            lineStartB: 20,
            lineCount: 12,
            similarity: 0.9,
          },
        ],
      },
    };
    const result = generateRecommendations(metrics, config);
    const dupRecs = result.filter((r) => r.category === 'duplication');
    expect(dupRecs.length).toBeGreaterThan(0);
  });

  it('generates test coverage recommendations', () => {
    const metrics: AnalysisMetrics = {
      ...baseMetrics(),
      fileHealth: {
        files: [
          { file: 'src/app.ts', lines: 100, complexity: 5, changes: 10, contributors: 1, healthScore: 80 },
          { file: 'src/util.ts', lines: 50, complexity: 3, changes: 5, contributors: 1, healthScore: 90 },
        ],
        averageHealth: 85,
      },
    };
    const result = generateRecommendations(metrics, config);
    const testRecs = result.filter((r) => r.category === 'testing');
    expect(testRecs.length).toBeGreaterThan(0);
  });

  it('sorts recommendations by severity', () => {
    const metrics: AnalysisMetrics = {
      ...baseMetrics(),
      complexity: {
        average: 15,
        highest: 40,
        highestFile: 'src/bad.ts',
        highComplexityFiles: [
          { file: 'src/bad.ts', complexity: 40, functionName: 'veryComplex', line: 10 },
        ],
      },
      fileHealth: {
        files: [
          { file: 'src/big.ts', lines: 600, complexity: 10, changes: 5, contributors: 2, healthScore: 60 },
        ],
        averageHealth: 60,
      },
    };
    const result = generateRecommendations(metrics, config);

    // First item should be high severity
    if (result.length > 0) {
      expect(result[0]!.severity).toBe('high');
    }

    // Severities should be in order
    for (let i = 1; i < result.length; i++) {
      const prevSeverity = result[i - 1]!.severity;
      const currSeverity = result[i]!.severity;
      const order = { high: 0, medium: 1, low: 2 };
      expect(order[prevSeverity] <= order[currSeverity]).toBe(true);
    }
  });
});
