import type {
  AnalysisMetrics,
  DevLensConfig,
  Recommendation,
  Severity,
} from '../types/index.js';

export function generateRecommendations(
  metrics: AnalysisMetrics,
  config: DevLensConfig,
): Recommendation[] {
  const recs: Recommendation[] = [];

  // Complexity recommendations
  for (const entry of metrics.complexity.highComplexityFiles) {
    if (entry.complexity > config.thresholds.complexity.warning) {
      const severity: Severity = entry.complexity > config.thresholds.complexity.high ? 'high' : 'medium';

      if (entry.functionName && entry.functionName !== '<file>') {
        recs.push({
          file: entry.file,
          line: entry.line,
          severity,
          category: 'complexity',
          title: `High cyclomatic complexity in ${entry.functionName}()`,
          description: `Function ${entry.functionName}() has a cyclomatic complexity of ${entry.complexity}.`,
          suggestion: `Split ${entry.functionName}() into smaller, focused functions. ` +
            'Extract conditional logic, loops, and nested operations into separate helper functions.',
        });
      }
    }
  }

  // Large file recommendations
  for (const fh of metrics.fileHealth.files) {
    if (fh.lines > config.thresholds.fileSize && fh.complexity > 10) {
      recs.push({
        file: fh.file,
        severity: 'medium',
        category: 'maintainability',
        title: `Large file with high complexity`,
        description: `${fh.file} has ${fh.lines} lines and complexity ${fh.complexity}.`,
        suggestion: `Consider splitting ${fh.file} into multiple modules. Aim for files under ${config.thresholds.fileSize} lines.`,
      });
    }
  }

  // Hotspot recommendations
  for (const h of metrics.git.hotspots.slice(0, 7)) {
    if (h.riskScore > 1 && h.complexity > 10) {
      recs.push({
        file: h.file,
        severity: h.riskScore > 20 ? 'high' : 'medium',
        category: 'maintainability',
        title: `High-risk hotspot with complex code`,
        description: `${h.file} has been changed ${h.changes} times and has complexity ${h.complexity}. Combined risk score: ${h.riskScore}.`,
        suggestion: `Refactor ${h.file} to reduce complexity and stabilize the code. ` +
          'Frequent changes + high complexity is a major source of bugs.',
      });
    }
  }

  // Duplication recommendations
  if (metrics.duplication.estimatedPercentage > config.thresholds.duplication.warningThreshold * 100) {
    recs.push({
      file: metrics.duplication.duplicates[0]?.fileA ?? '',
      severity: 'medium',
      category: 'duplication',
      title: `Code duplication detected`,
      description: `Estimated duplication is ${metrics.duplication.estimatedPercentage}% across ${metrics.duplication.duplicateBlockCount} blocks (${metrics.duplication.totalDuplicateLines} duplicated lines).`,
      suggestion: `Extract duplicated code blocks into shared utility functions or modules. The top duplicate block spans ${metrics.duplication.duplicates[0]?.lineCount ?? 0} lines.`,
    });
  }

  // Testing recommendations
  const testFiles = metrics.fileHealth.files.filter((f) =>
    f.file.includes('.test.') || f.file.includes('.spec.') || f.file.includes('__tests__'),
  );
  const srcFiles = metrics.fileHealth.files.filter((f) =>
    !f.file.includes('.test.') && !f.file.includes('.spec.') && !f.file.includes('__tests__'),
  );

  if (srcFiles.length > 0 && testFiles.length === 0) {
    recs.push({
      file: '',
      severity: 'high',
      category: 'testing',
      title: 'No test files found',
      description: `The project has ${srcFiles.length} source files but no test files were detected.`,
      suggestion: 'Add unit tests for core functionality. Start with the most complex and frequently changed files.',
    });
  } else if (testFiles.length < srcFiles.length * 0.3) {
    recs.push({
      file: '',
      severity: 'medium',
      category: 'testing',
      title: 'Low test coverage',
      description: `Only ${testFiles.length} test files for ${srcFiles.length} source files.`,
      suggestion: 'Increase test coverage, especially for high-complexity and high-churn files.',
    });
  }

  // Sort by severity
  const severityOrder: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  return recs.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
