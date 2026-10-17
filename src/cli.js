import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { registerCommands } from './commands/index.js';
import { LumenError, EXIT } from './errors.js';

export function getPackageJson() {
  const pkgPath = new URL('../package.json', import.meta.url);
  return JSON.parse(readFileSync(pkgPath, 'utf8'));
}

export function createCli() {
  const pkg = getPackageJson();

  const program = new Command();

  program
    .name('lumen')
    .description('Day-to-day CLI for Lumen projects')
    .version(pkg.version, '-V, --version', 'output the version number')
    .helpOption('-h, --help', 'display help for command')
    .option('-c, --cwd <dir>', 'working directory')
    .option('-v, --verbose', 'enable verbose output')
    .option('-j, --json', 'output in JSON format')
    .option('--no-color', 'disable colored output')
    .showSuggestionAfterError(true)
    .addHelpText(
      'after',
      `
Examples:
  $ lumen --help
  $ lumen -V
  $ lumen generate --help
  $ lumen g --help`
    )
    .action((options, command) => {
      if (command.args.length > 0) {
        command.unknownCommand();
      }
    });

  registerCommands(program);

  return program;
}

function handleLumenError(err, program, argv) {
  const opts = program.opts ? program.opts() : {};
  const isJson = opts.json || (Array.isArray(argv) && (argv.includes('--json') || argv.includes('-j')));

  if (isJson) {
    const payload = {
      error: err.message,
      code: err.code,
    };
    if (err.hint) {
      payload.hint = err.hint;
    }
    process.stderr.write(`${JSON.stringify(payload)}\n`);
  } else {
    process.stderr.write(`Error: ${err.message}\n`);
    if (err.hint) {
      process.stderr.write(`Hint: ${err.hint}\n`);
    }
  }
  process.exitCode = err.code ?? EXIT.USER;
}

function handleError(err, program, argv) {
  if (err instanceof LumenError) {
    handleLumenError(err, program, argv);
    return;
  }

  const opts = program.opts ? program.opts() : {};
  const verbose = opts.verbose || (Array.isArray(argv) && (argv.includes('--verbose') || argv.includes('-v')));
  const internal = new LumenError(err?.message || String(err), {
    code: EXIT.INTERNAL,
    hint: verbose ? undefined : 'Re-run with --verbose for the stack trace.',
  });
  handleLumenError(internal, program, argv);
  if (verbose && err?.stack) {
    process.stderr.write(`${err.stack}\n`);
  }
}

/**
 * Parses argv and runs the matched command. Returns the program synchronously;
 * `program.finished` resolves once async actions settle (errors are reported
 * and mapped to exit codes, never thrown as raw stack traces).
 */
export function runCli(argv = process.argv) {
  const program = createCli();

  program.finished = program.parseAsync(argv).catch((err) => {
    handleError(err, program, argv);
  });

  return program;
}
