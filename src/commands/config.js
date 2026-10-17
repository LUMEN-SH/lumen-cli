import { readConfig } from '../config/read.js';
import { LumenError, EXIT } from '../errors.js';

function getNestedValue(obj, dotPath) {
  const parts = dotPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return { found: false, value: undefined };
    }
    if (!(part in current)) {
      return { found: false, value: undefined };
    }
    current = current[part];
  }
  return { found: true, value: current };
}

function resolveConfigValue(configResult, pathStr) {
  // First search directly from root configResult ({ manifest, paths, root, file })
  const fromResult = getNestedValue(configResult, pathStr);
  if (fromResult.found) {
    return fromResult;
  }

  // Then search directly inside manifest
  const fromManifest = getNestedValue(configResult.manifest, pathStr);
  if (fromManifest.found) {
    return fromManifest;
  }

  return { found: false, value: undefined };
}

function printHumanSummary(configResult) {
  const { manifest, paths, file } = configResult;
  const { framework, styling, architecture, ui, tooling } = manifest;

  const lines = [
    `Configuration: ${file}`,
    '',
    `Framework:     ${framework?.name || 'none'}${framework?.variant ? ` (${framework.variant})` : ''}`,
    `Styling:       ${styling?.engine || 'none'}`,
    `Architecture:  ${architecture?.preset || architecture?.type || 'none'} (validation: ${architecture?.validation || 'none'})`,
    `UI Kit:        ${ui?.kit || 'none'}`,
    `Tooling:       ${[tooling?.language ? `lang: ${tooling.language}` : '', tooling?.linter ? `linter: ${tooling.linter}` : '', tooling?.formatter ? `formatter: ${tooling.formatter}` : ''].filter(Boolean).join(', ') || 'none'}`,
    '',
    'Resolved Paths:',
    `  features:    ${paths.features || 'none'}`,
    `  components:  ${paths.components || 'none'}`,
    `  services:    ${paths.services || 'none'}`,
    `  hooks:       ${paths.hooks || 'none'}`,
    `  pages:       ${paths.pages || 'none'}`,
    `  ui:          ${paths.ui || 'none'}`,
  ];

  process.stdout.write(`${lines.join('\n')}\n`);
}

export function registerConfig(program) {
  const config = program
    .command('config')
    .description('Inspect, query, and validate Lumen configuration')
    .addHelpText(
      'after',
      `
Examples:
  $ lumen config
  $ lumen config --json
  $ lumen config get architecture.preset
  $ lumen config get paths.features
  $ lumen config validate`
    )
    .action(() => {
      const globals = program.opts();
      const result = readConfig({ cwd: globals.cwd });

      if (globals.json) {
        process.stdout.write(`${JSON.stringify({
          file: result.file,
          root: result.root,
          manifest: result.manifest,
          paths: result.paths,
        }, null, 2)}\n`);
      } else {
        printHumanSummary(result);
      }
    });

  config
    .command('get <path>')
    .description('Get a configuration value by dot-notated path')
    .addHelpText(
      'after',
      `
Examples:
  $ lumen config get architecture.preset
  $ lumen config get paths.features
  $ lumen config get framework`
    )
    .action((pathStr) => {
      const globals = program.opts();
      const result = readConfig({ cwd: globals.cwd });
      const { found, value } = resolveConfigValue(result, pathStr);

      if (!found) {
        throw new LumenError(`Key '${pathStr}' not found in configuration`, {
          code: EXIT.USER,
          hint: `Run 'lumen config' to view available keys in this project`,
        });
      }

      if (globals.json) {
        process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
      } else if (typeof value === 'object' && value !== null) {
        process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
      } else {
        process.stdout.write(`${String(value)}\n`);
      }
    });

  config
    .command('validate')
    .description('Validate the configuration against schema and rules')
    .addHelpText(
      'after',
      `
Examples:
  $ lumen config validate
  $ lumen config validate --json`
    )
    .action(() => {
      const globals = program.opts();
      readConfig({ cwd: globals.cwd });

      if (globals.json) {
        process.stdout.write(`${JSON.stringify({ status: 'ok', valid: true }, null, 2)}\n`);
      } else {
        process.stdout.write('OK\n');
      }
    });

  return config;
}
