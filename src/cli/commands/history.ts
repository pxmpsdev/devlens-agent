import { Command } from 'commander';
import * as path from 'node:path';
import { analyzeRepository } from '../../analyzer/index.js';
import { loadConfig } from '../../config/index.js';
import chalk from 'chalk';

export function historyCommand(): Command {
  return new Command('history')
    .description('Show git history metrics')
    .argument('[path]', 'Path to the repository', '.')
    .option('-f, --format <format>', 'Output format: terminal, json', 'terminal')
    .action(async (targetPath: string, options: { format: string }) => {
      try {
        const absPath = path.resolve(targetPath);
        const config = await loadConfig(absPath);
        const result = await analyzeRepository(absPath, config);

        if (options.format === 'json') {
          process.stdout.write(JSON.stringify(result.metrics.git, null, 2));
        } else {
          const g = result.metrics.git;
          process.stdout.write(chalk.bold('\nGit History\n'));
          process.stdout.write(chalk.gray('─'.repeat(60) + '\n\n'));
          process.stdout.write(`  ${chalk.white('Total commits:')}     ${g.totalCommits}\n`);
          process.stdout.write(`  ${chalk.white('Contributors:')}      ${g.totalContributors}\n`);
          process.stdout.write(`  ${chalk.white('Churn rate:')}        ${g.churnRate}\n`);
          process.stdout.write(`  ${chalk.white('Hotspot files:')}     ${g.hotspots.length}\n`);
          process.stdout.write('\n');
        }
      } catch (error) {
        process.stderr.write(`Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        process.exit(2);
      }
    });
}
