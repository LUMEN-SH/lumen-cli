import { Command } from 'commander';
import { readFileSync } from 'node:fs';

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
    .helpOption('-h, --help', 'display help for command');

  return program;
}

export function runCli(argv = process.argv) {
  const program = createCli();
  return program.parse(argv);
}
