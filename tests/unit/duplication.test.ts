import { describe, it, expect } from 'vitest';
import { analyzeDuplication } from '../../src/analyzer/duplication/index.js';
import * as path from 'node:path';

describe('analyzeDuplication', () => {
  const dupDir = path.join(process.cwd(), 'tests/fixtures/duplicate-repo');

  it('detects duplicate blocks between files', () => {
    const files = ['tests/fixtures/duplicate-repo/dates.ts', 'tests/fixtures/duplicate-repo/timestamps.ts'];
    const result = analyzeDuplication(process.cwd(), files, 6);

    expect(result.estimatedPercentage).toBeGreaterThan(0);
    expect(result.duplicateBlockCount).toBeGreaterThan(0);
    expect(result.duplicates.length).toBeGreaterThan(0);
  });

  it('reports duplicate block details', () => {
    const files = ['tests/fixtures/duplicate-repo/dates.ts', 'tests/fixtures/duplicate-repo/timestamps.ts'];
    const result = analyzeDuplication(process.cwd(), files, 6);

    if (result.duplicates.length > 0) {
      const block = result.duplicates[0]!;
      expect(block).toHaveProperty('fileA');
      expect(block).toHaveProperty('fileB');
      expect(block).toHaveProperty('lineCount');
      expect(block).toHaveProperty('similarity');
      expect(block.similarity).toBeGreaterThan(0);
      expect(block.similarity).toBeLessThanOrEqual(1);
    }
  });

  it('handles empty file list', () => {
    const result = analyzeDuplication(process.cwd(), [], 6);
    expect(result.estimatedPercentage).toBe(0);
    expect(result.duplicateBlockCount).toBe(0);
  });

  it('respects minLines parameter', () => {
    const files = ['tests/fixtures/duplicate-repo/dates.ts', 'tests/fixtures/duplicate-repo/timestamps.ts'];
    const smallMin = analyzeDuplication(process.cwd(), files, 3);
    const largeMin = analyzeDuplication(process.cwd(), files, 10);

    // With higher min lines, fewer duplicates found
    expect(largeMin.duplicateBlockCount).toBeLessThanOrEqual(smallMin.duplicateBlockCount);
  });
});
