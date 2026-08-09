import { Command } from 'commander';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { analyzeRepository } from '../../analyzer/index.js';
import { loadConfig } from '../../config/index.js';
import { calculateHealthScore } from '../../scoring/index.js';
import { generateRecommendations } from '../../recommendations/index.js';
import { formatTerminal, formatJson, formatMarkdown } from '../../output/index.js';

export function reportCommand(): Command {
  return new Command('report')
    .description('Generate a full report and optionally save to file')
    .argument('[path]', 'Path to the repository', '.')
    .option('-f, --format <format>', 'Output format: terminal, json, markdown', 'terminal')
    .option('-o, --output <file>', 'Save report to file')
    .action(async (targetPath: string, options: { format: string; output?: string }) => {
      try {
        const absPath = path.resolve(targetPath);
        const config = await loadConfig(absPath);
        let result = await analyzeRepository(absPath, config);

        result.score = calculateHealthScore(result.metrics, config.scoring);
        result.recommendations = generateRecommendations(result.metrics, config);

        let output: string;
        switch (options.format) {
          case 'json':
            output = formatJson(result);
            break;
          case 'markdown':
            output = formatMarkdown(result);
            break;
          default:
            output = formatTerminal(result);
        }

        if (options.output) {
          fs.writeFileSync(options.output, output, 'utf-8');
          process.stdout.write(`Report saved to ${options.output}\n`);
        } else {
          process.stdout.write(output);
        }
      } catch (error) {
        process.stderr.write(`Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        process.exit(2);
      }
    });
}
