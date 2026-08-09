import type { AnalysisMetrics, HealthScore, ScoreBreakdown, ScoreGrade, ScoringWeights } from '../types/index.js';

export function calculateHealthScore(
  metrics: AnalysisMetrics,
  weights: ScoringWeights,
): HealthScore {
  const scores: ScoreBreakdown = {
    complexity: scoreComplexity(metrics),
    duplication: scoreDuplication(metrics),
    maintainability: scoreMaintainability(metrics),
    gitRisk: scoreGitRisk(metrics),
  };

  // Weighted average
  const overall = Math.round(
    scores.complexity * weights.complexity +
    scores.duplication * weights.duplication +
    scores.maintainability * weights.maintainability +
    scores.gitRisk * weights.gitRisk
  );

  const grade = scoreToGrade(overall);

  return { overall, breakdown: scores, grade };
}

function scoreComplexity(metrics: AnalysisMetrics): number {
  const avg = metrics.complexity.average;
  const highest = metrics.complexity.highest;

  // Average complexity: 1-5 is excellent, 20+ is bad
  let score = 100;
  if (avg > 20) score -= 40;
  else if (avg > 15) score -= 30;
  else if (avg > 10) score -= 20;
  else if (avg > 5) score -= 10;
  else score -= 0;

  // Penzalize for very high outliers
  if (highest > 50) score -= 20;
  else if (highest > 30) score -= 10;
  else if (highest > 20) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function scoreDuplication(metrics: AnalysisMetrics): number {
  const dup = metrics.duplication.estimatedPercentage;

  if (dup <= 3) return 100;
  if (dup <= 5) return 85;
  if (dup <= 10) return 70;
  if (dup <= 15) return 50;
  if (dup <= 20) return 30;
  return 10;
}

function scoreMaintainability(metrics: AnalysisMetrics): number {
  const files = metrics.fileHealth.files;
  if (files.length === 0) return 100;

  const avgHealth = metrics.fileHealth.averageHealth;

  // Scale 0-100 average health to a 0-100 score
  return Math.round(avgHealth);
}

function scoreGitRisk(metrics: AnalysisMetrics): number {
  const hotspots = metrics.git.hotspots;
  if (hotspots.length === 0) return 100;

  // Calculate based on risk scores
  const avgRisk = hotspots.reduce((s, h) => s + h.riskScore, 0) / hotspots.length;

  // 0 risk = 100, high risk = low score
  let score = 100 - avgRisk * 2;
  if (metrics.git.totalCommits === 0) score = 100;
  if (metrics.git.churnRate === 0) score = 100;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreToGrade(score: number): ScoreGrade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}
