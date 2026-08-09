import { Command } from 'commander';
import { analyzeCommand } from './commands/analyze.js';
import { hotspotsCommand } from './commands/hotspots.js';
import { historyCommand } from './commands/history.js';
import { reportCommand } from './commands/report.js';

const program = new Command();

program
  .name('devlens')
  .description('Analyze git repositories and score code health')
  .version('0.1.0')
  .addCommand(analyzeCommand())
  .addCommand(hotspotsCommand())
  .addCommand(historyCommand())
  .addCommand(reportCommand());

export async function run(argv: string[] = process.argv): Promise<void> {
  await program.parseAsync(argv);
}
