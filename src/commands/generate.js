import { registerGenerators } from './generate/index.js';

export function registerGenerate(program) {
  const generate = program
    .command('generate')
    .alias('g')
    .description('Generate project files and resources')
    .addHelpText(
      'after',
      `
Examples:
  $ lumen generate --help
  $ lumen g --help`
    )
    .action(() => {
      generate.help();
    });

  registerGenerators(generate);

  return generate;
}
