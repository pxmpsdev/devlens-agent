import { simpleGit, type SimpleGit } from 'simple-git';
import * as path from 'node:path';
import type { GitMetrics, HotspotEntry } from '../../types/index.js';

interface ChurnEntry {
  file: string;
  changes: number;
}

export async function analyzeGit(rootPath: string): Promise<GitMetrics> {
  const git: SimpleGit = simpleGit(rootPath);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    return {
      totalCommits: 0,
      totalContributors: 0,
      churnRate: 0,
      hotspots: [],
    };
  }

  const log = await git.log({ maxCount: 1000 });
  const totalCommits = log.total;
  const contributors = new Set(log.all.map((c) => c.author_email).filter(Boolean));
  const totalContributors = contributors.size;

  const churn: Map<string, number> = new Map();

  // Analyze churn from git log
  for (const commit of log.all) {
    try {
      const diff = await git.diff([
        '--numstat',
        `${commit.hash}~1`,
        commit.hash,
      ]);

      for (const line of diff.split('\n')) {
        if (!line.trim()) continue;
        const parts = line.split('\t');
        if (parts.length < 3) continue;
        const file = parts[2]!.trim();
        const added = parseInt(parts[0]!, 10) || 0;
        const deleted = parseInt(parts[1]!, 10) || 0;
        const existing = churn.get(file) ?? 0;
        churn.set(file, existing + added + deleted);
      }
    } catch {
      // skip commits that can't be diffed (initial, merge, etc.)
    }
  }

  // Calculate churn rate (average changes per file)
  const churnValues = [...churn.values()];
  const totalChurn = churnValues.reduce((s, v) => s + v, 0);
  const churnRate = churn.size > 0 ? Math.round((totalChurn / churn.size) * 10) / 10 : 0;

  // Build hotspots sorted by change count
  const entries: ChurnEntry[] = [...churn.entries()]
    .map(([file, changes]) => ({ file, changes }))
    .sort((a, b) => b.changes - a.changes);

  const hotspots: HotspotEntry[] = entries.slice(0, 30).map((e) => ({
    file: e.file,
    changes: e.changes,
    complexity: 0, // Will be enriched by hotspots module
    riskScore: 0,
  }));

  return { totalCommits, totalContributors, churnRate, hotspots };
}

export function enrichHotspotsWithComplexity(
  hotspots: HotspotEntry[],
  complexityMap: Map<string, number>,
  highRiskThreshold: number,
): HotspotEntry[] {
  return hotspots
    .map((h) => {
      const complexity = complexityMap.get(h.file) ?? 1;
      // Risk = normalized(churn) * log(complexity + 1)
      const riskScore = Math.round(h.changes * Math.log2(complexity + 1) * 10) / 10;
      return { ...h, complexity, riskScore };
    })
    .filter((h) => h.changes >= highRiskThreshold || h.riskScore > 0)
    .sort((a, b) => b.riskScore - a.riskScore);
}

export function buildComplexityMap(
  entries: { file: string; complexity: number }[],
): Map<string, number> {
  const map = new Map<string, number>();

  for (const entry of entries) {
    const existing = map.get(entry.file) ?? 0;
    map.set(entry.file, existing + entry.complexity);
  }

  return map;
}
