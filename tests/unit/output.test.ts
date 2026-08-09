import { describe, it, expect } from 'vitest';
import { formatJson, formatMarkdown, formatTerminal } from '../../src/output/index.js';
import type { AnalysisResult } from '../../src/types/index.js';

const mockResult: AnalysisResult = {
  repository: {
    name: 'test-repo',
    path: '/test/repo',
    branch: 'main',
    lastCommit: 'abc12345',
    totalFiles: 50,
    analyzedFiles: 20,
    languages: { TypeScript: 15, JavaScript: 5 },
  },
  score: {
    overall: 85,
    breakdown: { complexity: 90, duplication: 85, maintainability: 80, gitRisk: 85 },
    grade: 'B',
  },
  metrics: {
    complexity: {
      average: 4.2,
      highest: 15,
      highestFile: 'src/complex.ts',
      highComplexityFiles: [
        { file: 'src/complex.ts', complexity: 15, functionName: 'bigFunc', line: 10 },
      ],
    },
    duplication: {
      estimatedPercentage: 3.5,
      duplicateBlockCount: 2,
      totalDuplicateLines: 25,
      duplicates: [
        {
          fileA: 'src/a.ts',
          fileB: 'src/b.ts',
          lineStartA: 10,
          lineStartB: 20,
          lineCount: 8,
          similarity: 0.85,
        },
      ],
    },
    fileHealth: {
      files: [
        { file: 'src/app.ts', lines: 150, complexity: 8, changes: 5, contributors: 3, healthScore: 85 },
      ],
      averageHealth: 85,
    },
    git: {
      totalCommits: 150,
      totalContributors: 4,
      churnRate: 12,
      hotspots: [
        { file: 'src/api/users.ts', changes: 81, complexity: 12, riskScore: 15.5 },
      ],
    },
  },
  hotspots: [
    { file: 'src/api/users.ts', changes: 81, complexity: 12, riskScore: 15.5 },
  ],
  recommendations: [
    {
      file: 'src/complex.ts',
      line: 10,
      severity: 'medium',
      category: 'complexity',
      title: 'High complexity in bigFunc()',
      description: 'Function bigFunc() has complexity 15.',
      suggestion: 'Split into smaller functions.',
    },
  ],
  analyzedAt: '2025-01-01T00:00:00Z',
  duration: 1234,
};

describe('formatJson', () => {
  it('produces valid JSON', () => {
    const output = formatJson(mockResult);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('includes all top-level keys', () => {
    const output = formatJson(mockResult);
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('repository');
    expect(parsed).toHaveProperty('score');
    expect(parsed).toHaveProperty('metrics');
    expect(parsed).toHaveProperty('hotspots');
    expect(parsed).toHaveProperty('recommendations');
  });
});

describe('formatMarkdown', () => {
  it('produces markdown output', () => {
    const output = formatMarkdown(mockResult);
    expect(output).toContain('# DevLens Code Health Report');
    expect(output).toContain('## Health Score');
    expect(output).toContain('**85/100**');
    expect(output).toContain('test-repo');
  });
});

describe('formatTerminal', () => {
  it('produces terminal output', () => {
    const output = formatTerminal(mockResult);
    expect(output).toContain('DevLens Code Health');
    expect(output).toContain('test-repo');
    expect(output).toContain('85/100');
  });
});
