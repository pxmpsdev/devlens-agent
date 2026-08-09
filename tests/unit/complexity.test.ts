import { describe, it, expect } from 'vitest';
import { calculateCyclomaticComplexity, analyzeComplexity } from '../../src/analyzer/complexity/index.js';
import * as ts from 'typescript';

describe('calculateCyclomaticComplexity', () => {
  function getComplexity(code: string): number {
    const sf = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    let complexity = 1;

    function walk(node: ts.Node) {
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) {
        complexity = calculateCyclomaticComplexity(node);
      }
      ts.forEachChild(node, walk);
    }

    walk(sf);
    return complexity;
  }

  it('returns 1 for a simple function', () => {
    const code = `
      function add(a: number, b: number): number {
        return a + b;
      }
    `;
    expect(getComplexity(code)).toBe(1);
  });

  it('returns 2 for a function with one if statement', () => {
    const code = `
      function check(x: number): boolean {
        if (x > 0) {
          return true;
        }
        return false;
      }
    `;
    expect(getComplexity(code)).toBe(2);
  });

  it('returns 3 for a function with two if statements', () => {
    const code = `
      function check(a: number, b: number): boolean {
        if (a > 0) {
          return true;
        }
        if (b < 0) {
          return false;
        }
        return false;
      }
    `;
    expect(getComplexity(code)).toBe(3);
  });

  it('counts for loops', () => {
    const code = `
      function find(arr: number[]): number {
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] > 10) return arr[i];
        }
        return -1;
      }
    `;
    expect(getComplexity(code)).toBeGreaterThanOrEqual(3);
  });

  it('counts nested if/else', () => {
    const code = `
      function classify(x: number): string {
        if (x > 100) {
          if (x > 200) {
            return 'huge';
          } else {
            return 'large';
          }
        } else {
          if (x < 10) {
            return 'tiny';
          }
          return 'small';
        }
      }
    `;
    expect(getComplexity(code)).toBe(4);
  });

  it('counts ternary operators', () => {
    const code = `
      function getLabel(x: number): string {
        return x > 10 ? 'big' : x > 5 ? 'medium' : 'small';
      }
    `;
    expect(getComplexity(code)).toBe(3);
  });

  it('counts while and do-while', () => {
    const code = `
      function process(arr: number[]): number[] {
        let i = 0;
        while (i < arr.length) {
          i++;
        }
        let j = 0;
        do {
          j--;
        } while (j > 0);
        return arr;
      }
    `;
    expect(getComplexity(code)).toBe(3);
  });
});

describe('analyzeComplexity', () => {
  it('analyzes a directory of files', () => {
    const files = ['tests/fixtures/simple-repo/math.ts', 'tests/fixtures/complex-repo/auth.ts'];
    const result = analyzeComplexity(process.cwd(), files);

    expect(result.average).toBeGreaterThan(0);
    expect(result.highest).toBeGreaterThan(0);
    expect(result.highComplexityFiles.length).toBeGreaterThan(0);
  });

  it('handles empty file list', () => {
    const result = analyzeComplexity(process.cwd(), []);
    expect(result.average).toBe(0);
    expect(result.highest).toBe(0);
    expect(result.highComplexityFiles).toHaveLength(0);
  });

  it('handles non-existent files gracefully', () => {
    const result = analyzeComplexity(process.cwd(), ['nonexistent.ts']);
    expect(result.average).toBe(0);
  });
});
