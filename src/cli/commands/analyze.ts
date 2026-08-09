import { Command } from 'commander';
import * as path from 'node:path';
import { analyzeRepository } from '../../analyzer/index.js';
import { loadConfig } from '../../config/index.js';
import { calculateHealthScore } from '../../scoring/index.js';
import { generateRecommendations } from '../../recommendations/index.js';
import { formatTerminal, formatJson, formatMarkdown } from '../../output/index.js';

export function analyzeCommand(): Command {
  return new Command('analyze')
    .description('Analyze a repository and show a code health report')
    .argument('[path]', 'Path to the repository', '.')
    .option('-f, --format <format>', 'Output format: terminal, json, markdown', 'terminal')
    .option('-c, --config <path>', 'Path to config file')
    .action(async (targetPath: string, options: { format: string; config?: string }) => {
      try {
        const absPath = path.resolve(targetPath);
        const config = await loadConfig(options.config ? path.dirname(options.config) : absPath);
        let result = await analyzeRepository(absPath, config);

        // Calculate health score
        result.score = calculateHealthScore(result.metrics, config.scoring);

        // Generate recommendations
        result.recommendations = generateRecommendations(result.metrics, config);

        // Output
        switch (options.format) {
          case 'json':
            process.stdout.write(formatJson(result));
            break;
          case 'markdown':
            process.stdout.write(formatMarkdown(result));
            break;
          default:
            process.stdout.write(formatTerminal(result));
        }

        // Exit with code based on health score (for CI)
        if (result.score.overall < 40) {
          process.exit(1);
        }
      } catch (error) {
        process.stderr.write(`Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        process.exit(2);
      }
    });
}
