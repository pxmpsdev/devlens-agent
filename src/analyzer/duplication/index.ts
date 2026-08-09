import * as fs from 'node:fs';
import * as path from 'node:path';
import type { DuplicateBlock, DuplicationMetrics } from '../../types/index.js';

interface FileContent {
  path: string;
  lines: string[];
  normalized: string[];
}

export function analyzeDuplication(rootPath: string, files: string[], minLines = 6): DuplicationMetrics {
  const fileContents: FileContent[] = [];

  for (const relFile of files) {
    const absFile = path.join(rootPath, relFile);
    if (!isReadableText(absFile)) continue;

    try {
      const content = fs.readFileSync(absFile, 'utf-8');
      const lines = content.split('\n');
      const normalized = lines.map((l) => l.trim());
      fileContents.push({ path: relFile, lines, normalized });
    } catch {
      // skip
    }
  }

  const duplicates: DuplicateBlock[] = [];
  let totalDupLines = 0;

  // Compare each pair of files
  for (let i = 0; i < fileContents.length; i++) {
    for (let j = i + 1; j < fileContents.length; j++) {
      const blocks = findDuplicateBlocks(fileContents[i]!, fileContents[j]!, minLines);
      duplicates.push(...blocks);
      for (const b of blocks) {
        totalDupLines += b.lineCount;
      }
    }
  }

  // Also check within each file
  for (const fc of fileContents) {
    const blocks = findDuplicateBlocks(fc, fc, minLines, true);
    duplicates.push(...blocks);
    for (const b of blocks) {
      totalDupLines += b.lineCount;
    }
  }

  const totalLines = fileContents.reduce((s, fc) => s + fc.lines.length, 0) || 1;
  const percentage = Math.round((totalDupLines / totalLines) * 1000) / 10;

  return {
    estimatedPercentage: Math.min(percentage, 100),
    duplicateBlockCount: duplicates.length,
    totalDuplicateLines: totalDupLines,
    duplicates: duplicates.slice(0, 20),
  };
}

function findDuplicateBlocks(
  a: FileContent,
  b: FileContent,
  minLines: number,
  sameFile = false,
): DuplicateBlock[] {
  const blocks: DuplicateBlock[] = [];
  const seen = new Set<string>();

  for (let i = 0; i <= a.normalized.length - minLines; i++) {
    // Skip if line is empty or very short
    if (a.normalized[i]!.length < 3) continue;

    // Skip import/export lines
    if (a.normalized[i]!.startsWith('import ') || a.normalized[i]!.startsWith('export ')) continue;

    for (let j = 0; j <= b.normalized.length - minLines; j++) {
      if (sameFile && Math.abs(i - j) < minLines) continue;
      if (b.normalized[j]!.length < 3) continue;
      if (b.normalized[j]!.startsWith('import ') || b.normalized[j]!.startsWith('export ')) continue;

      // Check for match
      let matchLen = 0;
      while (
        i + matchLen < a.normalized.length &&
        j + matchLen < b.normalized.length &&
        a.normalized[i + matchLen] === b.normalized[j + matchLen] &&
        a.normalized[i + matchLen]!.length > 0
      ) {
        matchLen++;
      }

      if (matchLen >= minLines) {
        // Calculate actual similarity considering whitespace
        const similarity = calculateSimilarity(
          a.lines.slice(i, i + matchLen),
          b.lines.slice(j, j + matchLen),
        );

        const key = `${a.path}:${i}-${b.path}:${j}`;
        if (similarity >= 0.75 && !seen.has(key)) {
          seen.add(key);
          blocks.push({
            fileA: a.path,
            fileB: b.path,
            lineStartA: i + 1,
            lineStartB: j + 1,
            lineCount: matchLen,
            similarity: Math.round(similarity * 100) / 100,
          });
        }

        j += matchLen - 1; // skip matched region
      }
    }
  }

  return blocks;
}

function calculateSimilarity(linesA: string[], linesB: string[]): number {
  if (linesA.length === 0 || linesB.length === 0) return 0;

  let matches = 0;
  const n = Math.min(linesA.length, linesB.length);

  for (let i = 0; i < n; i++) {
    const a = linesA[i]!.trim();
    const b = linesB[i]!.trim();
    if (a === b) {
      matches++;
    } else if (levenshteinSimilarity(a, b) > 0.8) {
      matches += 0.5;
    }
  }

  return matches / n;
}

function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  // Simple distance approximation
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  let diffs = longer.length - shorter.length;

  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] !== longer[i]) diffs++;
  }

  return 1 - diffs / maxLen;
}

const TEXT_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts',
  '.py', '.rs', '.go', '.java', '.cs', '.php',
  '.css', '.scss', '.less', '.html', '.vue', '.svelte',
  '.json', '.yaml', '.yml', '.toml', '.xml', '.md', '.txt',
]);

function isReadableText(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_EXTS.has(ext);
}
