import chalk from 'chalk';
import type { AnalysisResult, Severity } from '../types/index.js';

export function formatTerminal(result: AnalysisResult): string {
  const { repository, score, metrics, hotspots, recommendations } = result;

  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(chalk.bold.cyan('DevLens Code Health'));
  lines.push(chalk.gray('─'.repeat(60)));
  lines.push('');
  lines.push(`  ${chalk.white('Repository:')}    ${repository.name}`);
  lines.push(`  ${chalk.white('Branch:')}         ${repository.branch}`);
  lines.push(`  ${chalk.white('Last commit:')}    ${repository.lastCommit}`);
  lines.push(`  ${chalk.white('Files analyzed:')} ${repository.analyzedFiles}`);
  lines.push(`  ${chalk.white('Total files:')}    ${repository.totalFiles}`);
  lines.push('');

  // Health Score
  const gradeColor = scoreGradeColor(score.grade);
  lines.push(`  ${chalk.white('Health Score:')}   ${gradeColor(score.overall + '/100')}  ${gradeColor(score.grade)}`);
  lines.push('');

  // Complexity
  lines.push(chalk.bold('Complexity'));
  lines.push(`  ${chalk.white('Average:')}  ${metrics.complexity.average}`);
  lines.push(`  ${chalk.white('Highest:')}  ${metrics.complexity.highest}  ${chalk.gray(`(${metrics.complexity.highestFile})`)}`);

  if (metrics.complexity.highComplexityFiles.length > 0) {
    lines.push(`  ${chalk.white('Top complex functions:')}`);
    for (const entry of metrics.complexity.highComplexityFiles.slice(0, 5)) {
      if (entry.functionName && entry.functionName !== '<file>') {
        lines.push(`    ${chalk.yellow(entry.complexity.toString())}  ${chalk.gray(entry.file)}:${entry.line}  ${chalk.white(entry.functionName + '()')}`);
      }
    }
  }
  lines.push('');

  // Duplication
  lines.push(chalk.bold('Code Duplication'));
  const dupPct = metrics.duplication.estimatedPercentage;
  const dupColor = dupPct > 10 ? chalk.red : dupPct > 5 ? chalk.yellow : chalk.green;
  lines.push(`  ${chalk.white('Estimated:')}  ${dupColor(dupPct + '%')}`);
  if (metrics.duplication.duplicateBlockCount > 0) {
    lines.push(`  ${chalk.white('Blocks:')}     ${metrics.duplication.duplicateBlockCount} (${metrics.duplication.totalDuplicateLines} duplicated lines)`);
  }
  lines.push('');

  // File Health
  lines.push(chalk.bold('File Health'));
  lines.push(`  ${chalk.white('Average:')}  ${metrics.fileHealth.averageHealth}/100`);
  const unhealthy = metrics.fileHealth.files.filter((f) => f.healthScore < 50);
  if (unhealthy.length > 0) {
    lines.push(`  ${chalk.white('Unhealthy files:')}  ${unhealthy.length}`);
    for (const f of unhealthy.slice(0, 3)) {
      lines.push(`    ${chalk.red(f.healthScore.toString())}  ${chalk.gray(f.file)}  ${chalk.white(`(${f.lines} lines, complexity ${f.complexity})`)}`);
    }
  }
  lines.push('');

  // Git Hotspots
  lines.push(chalk.bold('Git Hotspots'));
  const topSpots = hotspots.slice(0, 7);
  if (topSpots.length === 0) {
    lines.push(`  ${chalk.gray('No significant hotspots detected')}`);
  } else {
    for (const spot of topSpots) {
      const riskColor = spot.riskScore > 20 ? chalk.red : spot.riskScore > 10 ? chalk.yellow : chalk.white;
      lines.push(`  ${riskColor(spot.riskScore.toFixed(1))}  ${chalk.gray(spot.file.padEnd(40))}  ${chalk.white(`${spot.changes} changes`)}`);
    }
  }
  lines.push('');

  // Recommendations
  lines.push(chalk.bold('Recommendations'));
  if (recommendations.length === 0) {
    lines.push(`  ${chalk.green('✓ No issues found')}`);
  } else {
    for (const rec of recommendations.slice(0, 10)) {
      const icon = severityIcon(rec.severity);
      const sevColor = severityColor(rec.severity);
      lines.push(`  ${icon} ${sevColor(rec.title)}`);
      if (rec.file) {
        const fileLoc = rec.line ? `${rec.file}:${rec.line}` : rec.file;
        lines.push(`    ${chalk.gray(fileLoc)}`);
      }
      lines.push(`    ${chalk.gray(rec.description)}`);
      lines.push(`    ${chalk.white(rec.suggestion)}`);
      lines.push('');
    }
  }

  // Footer
  lines.push(chalk.gray('─'.repeat(60)));
  lines.push(`  ${chalk.gray(`Analyzed in ${(result.duration / 1000).toFixed(2)}s`)}`);
  lines.push('');

  return lines.join('\n');
}

export function formatJson(result: AnalysisResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatMarkdown(result: AnalysisResult): string {
  const { repository, score, metrics, hotspots, recommendations } = result;

  const lines: string[] = [];

  lines.push('# DevLens Code Health Report');
  lines.push('');
  lines.push(`**Repository:** ${repository.name}  `);
  lines.push(`**Branch:** ${repository.branch}  `);
  lines.push(`**Analyzed:** ${new Date(result.analyzedAt).toLocaleDateString()}  `);
  lines.push(`**Files:** ${repository.analyzedFiles} analyzed / ${repository.totalFiles} total`);
  lines.push('');

  lines.push('## Health Score');
  lines.push('');
  lines.push(`| Overall | Grade | Complexity | Duplication | Maintainability | Git Risk |`);
  lines.push(`|---------|-------|------------|-------------|-----------------|----------|`);
  lines.push(`| **${score.overall}/100** | ${score.grade} | ${score.breakdown.complexity} | ${score.breakdown.duplication} | ${score.breakdown.maintainability} | ${score.breakdown.gitRisk} |`);
  lines.push('');

  lines.push('## Complexity');
  lines.push('');
  lines.push(`- **Average:** ${metrics.complexity.average}`);
  lines.push(`- **Highest:** ${metrics.complexity.highest} (${metrics.complexity.highestFile})`);
  lines.push('');
  if (metrics.complexity.highComplexityFiles.length > 0) {
    lines.push('| Complexity | File | Function |');
    lines.push('|-----------|------|----------|');
    for (const e of metrics.complexity.highComplexityFiles.slice(0, 10)) {
      const fn = e.functionName && e.functionName !== '<file>' ? `\`${e.functionName}()\`` : '-';
      lines.push(`| ${e.complexity} | \`${e.file}\` | ${fn} |`);
    }
    lines.push('');
  }

  lines.push('## Hotspots');
  lines.push('');
  if (hotspots.length === 0) {
    lines.push('No significant hotspots detected.');
  } else {
    lines.push('| Risk Score | File | Changes | Complexity |');
    lines.push('|-----------|------|---------|------------|');
    for (const h of hotspots.slice(0, 15)) {
      lines.push(`| ${h.riskScore.toFixed(1)} | \`${h.file}\` | ${h.changes} | ${h.complexity} |`);
    }
  }
  lines.push('');

  lines.push('## Recommendations');
  lines.push('');
  if (recommendations.length === 0) {
    lines.push('No issues found. ✓');
  } else {
    for (const rec of recommendations.slice(0, 15)) {
      const severity = rec.severity.toUpperCase();
      lines.push(`- **${severity}** ${rec.title}`);
      if (rec.file) {
        const loc = rec.line ? `${rec.file}:${rec.line}` : rec.file;
        lines.push(`  - File: \`${loc}\``);
      }
      lines.push(`  - ${rec.description}`);
      lines.push(`  - 💡 ${rec.suggestion}`);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push(`*Generated by [DevLens](https://github.com/devlens/devlens) in ${(result.duration / 1000).toFixed(2)}s*`);

  return lines.join('\n');
}

function scoreGradeColor(grade: string): (text: string) => string {
  switch (grade) {
    case 'A': return chalk.green;
    case 'B': return chalk.greenBright;
    case 'C': return chalk.yellow;
    case 'D': return chalk.redBright;
    default: return chalk.red;
  }
}

function severityColor(severity: Severity): (text: string) => string {
  switch (severity) {
    case 'high': return chalk.red;
    case 'medium': return chalk.yellow;
    default: return chalk.gray;
  }
}

function severityIcon(severity: Severity): string {
  switch (severity) {
    case 'high': return chalk.red('⚠');
    case 'medium': return chalk.yellow('⚡');
    case 'low': return chalk.gray('•');
  }
}
