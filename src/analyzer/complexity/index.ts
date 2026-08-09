import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';
import type { ComplexityEntry, ComplexityMetrics } from '../../types/index.js';

interface AnalyzedFile {
  path: string;
  source: string;
  sourceFile: ts.SourceFile;
}

export function analyzeComplexity(
  rootPath: string,
  files: string[],
): ComplexityMetrics {
  const entries: ComplexityEntry[] = [];
  const fileComplexities: { file: string; total: number }[] = [];

  for (const relFile of files) {
    const absFile = path.join(rootPath, relFile);
    if (!isAnalyzable(absFile)) continue;

    try {
      const source = fs.readFileSync(absFile, 'utf-8');
      const sourceFile = ts.createSourceFile(absFile, source, ts.ScriptTarget.Latest, true);

      const fileEntries = analyzeSourceFile(relFile, source, sourceFile);
      entries.push(...fileEntries);
      const total = fileEntries.reduce((sum, e) => sum + e.complexity, 0);
      fileComplexities.push({ file: relFile, total });
    } catch {
      // skip unparseable files
    }
  }

  const sorted = entries.sort((a, b) => b.complexity - a.complexity);
  const highest = sorted[0] ?? { file: '', complexity: 0, functionName: '' };
  const totalComplexity = fileComplexities.reduce((s, f) => s + f.total, 0);
  const fileCount = fileComplexities.length || 1;

  return {
    average: Math.round((totalComplexity / fileCount) * 10) / 10,
    highest: highest.complexity,
    highestFile: highest.file ?? '',
    highComplexityFiles: sorted.slice(0, 10),
  };
}

function isAnalyzable(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'].includes(ext);
}

function analyzeSourceFile(
  relFile: string,
  source: string,
  sourceFile: ts.SourceFile,
): ComplexityEntry[] {
  const entries: ComplexityEntry[] = [];

  function walk(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) {
      const complexity = calculateCyclomaticComplexity(node);
      if (complexity > 0) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        const name = ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)
          ? node.name?.getText(sourceFile) ?? '<anonymous>'
          : '<arrow>';

        entries.push({
          file: relFile,
          complexity,
          functionName: name,
          line: line + 1,
        });
      }
    }

    ts.forEachChild(node, walk);
  }

  walk(sourceFile);

  // Also check file-level complexity (too large files)
  const fileComplexity = calculateFileComplexity(source);
  if (fileComplexity > 0) {
    entries.push({
      file: relFile,
      complexity: fileComplexity,
      functionName: '<file>',
      line: 1,
    });
  }

  return entries;
}

export function calculateCyclomaticComplexity(node: ts.Node): number {
  let complexity = 1;

  function count(node: ts.Node) {
    if (
      ts.isIfStatement(node) ||
      ts.isForStatement(node) ||
      ts.isForInStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isWhileStatement(node) ||
      ts.isDoStatement(node) ||
      ts.isCaseClause(node) ||
      ts.isDefaultClause(node) ||
      ts.isConditionalExpression(node) ||
      (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) ||
      (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.BarBarToken)
    ) {
      complexity++;
    }

    if (ts.isFunctionLike(node)) {
      // Don't descend into inner functions
      return;
    }

    ts.forEachChild(node, count);
  }

  if ((node as ts.FunctionLikeDeclaration).body) {
    count((node as ts.FunctionLikeDeclaration).body!);
  }

  return complexity;
}

function calculateFileComplexity(source: string): number {
  const lines = source.split('\n');
  const loc = lines.filter((l) => l.trim().length > 0).length;

  // File complexity is based on length: 0 for normal files, increases for large ones
  if (loc <= 200) return 0;
  if (loc <= 500) return Math.round(loc / 50);
  if (loc <= 1000) return Math.round(loc / 30);
  return Math.round(loc / 20);
}
