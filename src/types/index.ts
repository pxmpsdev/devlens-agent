export interface AnalysisResult {
  repository: RepositoryInfo;
  score: HealthScore;
  metrics: AnalysisMetrics;
  hotspots: HotspotEntry[];
  recommendations: Recommendation[];
  analyzedAt: string;
  duration: number;
}

export interface RepositoryInfo {
  name: string;
  path: string;
  branch: string;
  lastCommit: string;
  totalFiles: number;
  analyzedFiles: number;
  languages: Record<string, number>;
}

export interface HealthScore {
  overall: number;
  breakdown: ScoreBreakdown;
  grade: ScoreGrade;
}

export interface ScoreBreakdown {
  complexity: number;
  duplication: number;
  maintainability: number;
  gitRisk: number;
}

export type ScoreGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface AnalysisMetrics {
  complexity: ComplexityMetrics;
  duplication: DuplicationMetrics;
  fileHealth: FileHealthMetrics;
  git: GitMetrics;
}

export interface ComplexityMetrics {
  average: number;
  highest: number;
  highestFile: string;
  highComplexityFiles: ComplexityEntry[];
}

export interface ComplexityEntry {
  file: string;
  complexity: number;
  functionName?: string;
  line?: number;
}

export interface DuplicationMetrics {
  estimatedPercentage: number;
  duplicateBlockCount: number;
  totalDuplicateLines: number;
  duplicates: DuplicateBlock[];
}

export interface DuplicateBlock {
  fileA: string;
  fileB: string;
  lineStartA: number;
  lineStartB: number;
  lineCount: number;
  similarity: number;
}

export interface FileHealthMetrics {
  files: FileHealthEntry[];
  averageHealth: number;
}

export interface FileHealthEntry {
  file: string;
  lines: number;
  complexity: number;
  changes: number;
  contributors: number;
  healthScore: number;
}

export interface GitMetrics {
  totalCommits: number;
  totalContributors: number;
  churnRate: number;
  hotspots: HotspotEntry[];
}

export interface HotspotEntry {
  file: string;
  changes: number;
  complexity: number;
  riskScore: number;
}

export interface Recommendation {
  file: string;
  line?: number;
  severity: Severity;
  category: RecommendationCategory;
  title: string;
  description: string;
  suggestion: string;
}

export type Severity = 'high' | 'medium' | 'low';

export type RecommendationCategory =
  | 'complexity'
  | 'duplication'
  | 'maintainability'
  | 'testing'
  | 'dependencies'
  | 'security';

export interface AnalysisOptions {
  format: 'terminal' | 'json' | 'markdown';
  includePatterns?: string[];
  excludePatterns?: string[];
  maxFileSize?: number;
  minConfidence?: number;
}

export interface DevLensConfig {
  scoring: ScoringWeights;
  exclude: string[];
  thresholds: ThresholdConfig;
  languages: string[];
}

export interface ScoringWeights {
  complexity: number;
  duplication: number;
  maintainability: number;
  gitRisk: number;
}

export interface ThresholdConfig {
  complexity: {
    high: number;
    warning: number;
  };
  fileSize: number;
  duplication: {
    minBlockLines: number;
    warningThreshold: number;
  };
  hotspot: {
    minChanges: number;
    highRisk: number;
  };
}
