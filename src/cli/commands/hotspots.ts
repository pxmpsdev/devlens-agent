import { Command } from 'commander';
import * as path from 'node:path';
import { analyzeRepository } from '../../analyzer/index.js';
import { loadConfig } from '../../config/index.js';
import chalk from 'chalk';

export function hotspotsCommand(): Command {
  return new Command('hotspots')
    .description('Show git hotspots (frequently changed files)')
    .argument('[path]', 'Path to the repository', '.')
    .option('-f, --format <format>', 'Output format: terminal, json', 'terminal')
    .option('-n, --limit <number>', 'Number of hotspots to show', '20')
    .action(async (targetPath: string, options: { format: string; limit: string }) => {
      try {
        const absPath = path.resolve(targetPath);
        const config = await loadConfig(absPath);
        const result = await analyzeRepository(absPath, config);

        const hotspots = result.hotspots.slice(0, parseInt(options.limit, 10));

        if (options.format === 'json') {
          process.stdout.write(JSON.stringify(hotspots, null, 2));
        } else {
          if (hotspots.length === 0) {
            process.stdout.write(chalk.gray('No significant hotspots detected.\n'));
          } else {
            process.stdout.write(chalk.bold('\nGit Hotspots\n'));
            process.stdout.write(chalk.gray('─'.repeat(60) + '\n\n'));
            for (const h of hotspots) {
              const risk = h.riskScore > 20 ? chalk.red(h.riskScore.toFixed(1)) :
                           h.riskScore > 10 ? chalk.yellow(h.riskScore.toFixed(1)) :
                           chalk.white(h.riskScore.toFixed(1));
              process.stdout.write(`  ${risk}  ${chalk.gray(h.file.padEnd(40))}  ${chalk.white(`${h.changes} changes, complexity ${h.complexity}`)}\n`);
            }
            process.stdout.write('\n');
          }
        }
      } catch (error) {
        process.stderr.write(`Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        process.exit(2);
      }
    });
}
