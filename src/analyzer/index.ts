import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'node:fs/promises';
import type { AnalysisMetrics, AnalysisResult, DevLensConfig, FileHealthEntry } from '../types/index.js';
import { analyzeComplexity } from './complexity/index.js';
import { analyzeDuplication } from './duplication/index.js';
import { analyzeGit, buildComplexityMap, enrichHotspotsWithComplexity } from './git/index.js';
import { analyzeFileHealth } from './files/index.js';

export async function analyzeRepository(
  rootPath: string,
  config: DevLensConfig,
): Promise<AnalysisResult> {
  const startTime = Date.now();

  // Get absolute path
  const absPath = path.resolve(rootPath);

  // Collect files to analyze
  const files = await collectFiles(absPath, config);

  // Git analysis (runs first as it's independent)
  const gitMetrics = await analyzeGit(absPath);

  // Complexity analysis
  const complexity = analyzeComplexity(absPath, files.jsFiles);

  // Duplication analysis
  const duplication = analyzeDuplication(absPath, files.jsFiles, config.thresholds.duplication.minBlockLines);

  // Build complexity map and enrich hotspots
  const complexityMap = buildComplexityMap(complexity.highComplexityFiles);
  const enrichedHotspots = enrichHotspotsWithComplexity(
    gitMetrics.hotspots,
    complexityMap,
    config.thresholds.hotspot.minChanges,
  );

  // Build git info map for file health
  const gitInfo = new Map<string, { changes: number; contributors: number }>();
  for (const h of enrichedHotspots) {
    gitInfo.set(h.file, { changes: h.changes, contributors: 1 });
  }

  // File health analysis
  const fileHealth = analyzeFileHealth(absPath, files.jsFiles, gitInfo);

  const metrics: AnalysisMetrics = {
    complexity,
    duplication,
    fileHealth,
    git: { ...gitMetrics, hotspots: enrichedHotspots },
  };

  // Repository info
  const repoInfo = {
    name: path.basename(absPath),
    path: absPath,
    branch: 'unknown',
    lastCommit: '',
    totalFiles: files.allFiles.length,
    analyzedFiles: files.jsFiles.length,
    languages: estimateLanguages(files.allFiles),
  };

  try {
    const { simpleGit } = await import('simple-git');
    const git = simpleGit(absPath);
    const isRepo = await git.checkIsRepo();
    if (isRepo) {
      const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
      repoInfo.branch = branch.trim();
      const log = await git.log({ maxCount: 1 });
      if (log.latest) {
        repoInfo.lastCommit = log.latest.hash.slice(0, 8);
      }
    }
  } catch {
    // not a git repo
  }

  const duration = Date.now() - startTime;

  return {
    repository: repoInfo,
    score: { overall: 0, breakdown: { complexity: 0, duplication: 0, maintainability: 0, gitRisk: 0 }, grade: 'F' },
    metrics,
    hotspots: enrichedHotspots,
    recommendations: [],
    analyzedAt: new Date().toISOString(),
    duration,
  };
}

async function collectFiles(
  rootPath: string,
  config: DevLensConfig,
): Promise<{ allFiles: string[]; jsFiles: string[] }> {
  const allFiles: string[] = [];
  const jsFiles: string[] = [];

  const jsExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts']);

  const excludeSet = new Set(config.exclude.map((e) => e.toLowerCase()));

  async function walk(dir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.env') {
        if (entry.name !== '.devlensrc' && !entry.name.startsWith('.devlens')) continue;
      }

      if (excludeSet.has(entry.name.toLowerCase())) continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const rel = path.relative(rootPath, fullPath);
        const ext = path.extname(entry.name).toLowerCase();

        // Check exclude patterns (glob too)
        let excluded = false;
        for (const pattern of config.exclude) {
          if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\./g, '\\.') + '$');
            if (regex.test(entry.name)) {
              excluded = true;
              break;
            }
          }
        }

        if (excluded) continue;

        allFiles.push(rel);
        if (jsExts.has(ext)) {
          jsFiles.push(rel);
        }
      }
    }
  }

  walk(rootPath);
  return { allFiles, jsFiles };
}

function estimateLanguages(files: string[]): Record<string, number> {
  const extMap: Record<string, string> = {
    '.ts': 'TypeScript', '.tsx': 'TypeScript', '.mts': 'TypeScript', '.cts': 'TypeScript',
    '.js': 'JavaScript', '.jsx': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript',
    '.py': 'Python',
    '.rs': 'Rust',
    '.go': 'Go',
    '.java': 'Java',
    '.cs': 'C#',
    '.php': 'PHP',
    '.rb': 'Ruby',
    '.swift': 'Swift',
    '.kt': 'Kotlin',
    '.scala': 'Scala',
    '.dart': 'Dart',
    '.vue': 'Vue',
    '.svelte': 'Svelte',
    '.css': 'CSS', '.scss': 'SCSS', '.less': 'Less',
    '.html': 'HTML',
    '.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML',
    '.md': 'Markdown',
  };

  const counts: Record<string, number> = {};

  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    const lang = extMap[ext] ?? 'Other';
    counts[lang] = (counts[lang] ?? 0) + 1;
  }

  return counts;
}
