import * as fs from 'node:fs';
import * as path from 'node:path';
import type { FileHealthEntry, FileHealthMetrics } from '../../types/index.js';
import { calculateCyclomaticComplexity } from '../complexity/index.js';
import * as ts from 'typescript';

interface GitFileInfo {
  changes: number;
  contributors: number;
}

export function analyzeFileHealth(
  rootPath: string,
  files: string[],
  gitInfo: Map<string, GitFileInfo>,
): FileHealthMetrics {
  const entries: FileHealthEntry[] = [];

  for (const relFile of files) {
    const absFile = path.join(rootPath, relFile);
    if (!isAnalyzableFile(absFile)) continue;

    try {
      const source = fs.readFileSync(absFile, 'utf-8');
      const lines = source.split('\n').length;
      const loc = source.split('\n').filter((l) => l.trim().length > 0).length;

      // Calculate file-level complexity
      let complexity = 1;
      try {
        const sf = ts.createSourceFile(absFile, source, ts.ScriptTarget.Latest, true);
        complexity = calculateFileComplexityFromAST(sf);
      } catch {
        complexity = 1;
      }

      const info = gitInfo.get(relFile) ?? { changes: 0, contributors: 0 };

      const healthScore = calculateFileHealthScore(loc, complexity, info.changes, info.contributors);

      entries.push({
        file: relFile,
        lines: loc,
        complexity,
        changes: info.changes,
        contributors: info.contributors,
        healthScore,
      });
    } catch {
      // skip
    }
  }

  const avgHealth = entries.length > 0
    ? Math.round((entries.reduce((s, e) => s + e.healthScore, 0) / entries.length) * 10) / 10
    : 0;

  return {
    files: entries.sort((a, b) => a.healthScore - b.healthScore),
    averageHealth: avgHealth,
  };
}

function calculateFileComplexityFromAST(sourceFile: ts.SourceFile): number {
  let complexity = 1;

  function walk(node: ts.Node) {
    if (
      ts.isIfStatement(node) ||
      ts.isForStatement(node) ||
      ts.isForInStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isWhileStatement(node) ||
      ts.isDoStatement(node) ||
      ts.isConditionalExpression(node)
    ) {
      complexity++;
    }
    ts.forEachChild(node, walk);
  }

  function findFunctions(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) {
      complexity += calculateCyclomaticComplexity(node);
    } else {
      ts.forEachChild(node, findFunctions);
    }
  }

  walk(sourceFile);
  findFunctions(sourceFile);

  return complexity;
}

function calculateFileHealthScore(
  loc: number,
  complexity: number,
  changes: number,
  contributors: number,
): number {
  // 0-100 scale, higher = healthier
  let score = 100;

  // Penalize large files
  if (loc > 1000) score -= 30;
  else if (loc > 500) score -= 20;
  else if (loc > 300) score -= 10;
  else if (loc > 200) score -= 5;

  // Penalize high complexity
  if (complexity > 50) score -= 25;
  else if (complexity > 30) score -= 15;
  else if (complexity > 20) score -= 10;
  else if (complexity > 10) score -= 5;

  // Penalize high churn
  if (changes > 100) score -= 20;
  else if (changes > 50) score -= 10;
  else if (changes > 20) score -= 5;

  // Bonus for multiple contributors (bus factor)
  if (contributors > 3) score += 5;
  if (contributors > 1) score += 3;

  return Math.max(0, Math.min(100, score));
}

function isAnalyzableFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'].includes(ext);
}
