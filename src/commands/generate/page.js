import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readConfig } from '../../config/index.js';
import { LumenError, EXIT } from '../../errors.js';
import { runGenerator } from '../../generators/core.js';
import { buildNameVariants } from '../../generators/names.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PAGE_TEMPLATE_DIR = path.resolve(__dirname, '../../../templates/page');

const ROUTER_FILENAMES = [
  'index.tsx',
  'routes.tsx',
  'router.tsx',
  'index.jsx',
  'routes.jsx',
  'router.jsx',
  'index.ts',
  'routes.ts',
  'router.ts',
  'index.js',
  'routes.js',
  'router.js',
];

/**
 * Searches for a router file under the pages directory.
 * @param {string} pagesDir Absolute path to pages directory
 * @returns {string | null} Absolute path to router file or null
 */
function findRouterFile(pagesDir) {
  if (!fs.existsSync(pagesDir)) {
    return null;
  }
  for (const filename of ROUTER_FILENAMES) {
    const candidate = path.join(pagesDir, filename);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

/**
 * Builds the route definition and import snippet for a page component.
 * @param {object} variants
 * @returns {{ importStatement: string, routeStatement: string, fullSnippet: string }}
 */
function buildRouteSnippet(variants) {
  const componentName = `${variants.Name}Page`;
  const routePath = `/${variants.nameKebab}`;
  const importStatement = `import { ${componentName} } from './${componentName}';`;
  const routeStatement = `{ path: '${routePath}', element: <${componentName} /> },`;
  const fullSnippet = `${importStatement}\n${routeStatement}`;
  return {
    componentName,
    routePath,
    importStatement,
    routeStatement,
    fullSnippet,
  };
}

/**
 * Attempts to register a route in the router file using the `// lumen:routes` marker.
 *
 * @param {object} params
 * @param {string} params.routerFilePath Absolute path to router file
 * @param {object} params.snippet Route snippet details
 * @param {boolean} params.dryRun
 * @returns {{ registered: boolean, markerFound: boolean }}
 */
function registerRouteInFile({ routerFilePath, snippet, dryRun }) {
  const content = fs.readFileSync(routerFilePath, 'utf8');
  const markerIndex = content.indexOf('// lumen:routes');

  if (markerIndex === -1) {
    return { registered: false, markerFound: false };
  }

  // Extract indentation before marker
  const lineStart = content.lastIndexOf('\n', markerIndex) + 1;
  const lineIndent = content.slice(lineStart, markerIndex);

  // Split into lines or insert relative to marker
  const insertion = `\n${lineIndent}${snippet.routeStatement}`;
  const updatedContent =
    content.slice(0, markerIndex + '// lumen:routes'.length) +
    insertion +
    content.slice(markerIndex + '// lumen:routes'.length);

  // Also check if import already exists; if not, prepend import at the top
  let finalContent = updatedContent;
  if (!updatedContent.includes(snippet.importStatement)) {
    finalContent = `${snippet.importStatement}\n${updatedContent}`;
  }

  if (!dryRun) {
    fs.writeFileSync(routerFilePath, finalContent, 'utf8');
  }

  return { registered: true, markerFound: true };
}

/**
 * Subcommand `lumen generate page <name>` (alias `g page <name>`).
 * @param {import('commander').Command} generate
 */
export function registerPage(generate) {
  generate
    .command('page <name>')
    .alias('p')
    .description('Scaffold a route page for React + Vite')
    .option('--dry-run', 'preview file operations without writing to disk')
    .option('--force', 'overwrite existing files')
    .option('--register', 'insert route snippet into router file if // lumen:routes marker is found')
    .addHelpText(
      'after',
      `
Examples:
  $ lumen generate page settings
  $ lumen g page billing --register
  $ lumen g page dashboard --dry-run
  $ lumen g page profile --force`
    )
    .action(async (name, cmdOpts) => {
      const globalOpts = generate.optsWithGlobals ? generate.optsWithGlobals() : generate.opts();
      const options = { ...globalOpts, ...cmdOpts };
      const cwd = options.cwd || process.cwd();

      const { manifest, paths, root } = readConfig({ cwd });

      // Reject Next.js projects as tracked in issue #32
      if (manifest?.framework?.name === 'next') {
        throw new LumenError(
          'Next.js page generation is tracked in issue #32 and is not yet supported in this version.',
          {
            code: EXIT.USER,
            hint: 'Next.js uses App Router / Pages directory conventions; track #32 for support.',
          }
        );
      }

      // Validate paths.pages
      if (!paths || !paths.pages) {
        throw new LumenError(
          'Generator target "pages" is not configured in manifest paths.',
          {
            code: EXIT.CONFIG,
            hint: 'Ensure your lumen.config.json paths object contains a "pages" entry.',
          }
        );
      }

      const variants = buildNameVariants(name);
      const snippet = buildRouteSnippet(variants);

      // Execute generator
      const genResult = await runGenerator({
        kind: 'pages',
        name,
        templateDir: PAGE_TEMPLATE_DIR,
        options: {
          ...options,
          cwd,
        },
      });

      // Search for router file in paths.pages
      const pagesDir = path.resolve(root, paths.pages);
      const routerFilePath = findRouterFile(pagesDir);
      let registrationResult = null;

      if (routerFilePath) {
        const routerRelPath = path.relative(root, routerFilePath);

        if (options.register) {
          registrationResult = registerRouteInFile({
            routerFilePath,
            snippet,
            dryRun: Boolean(options.dryRun),
          });
        }

        if (!options.json) {
          process.stdout.write(`\nRouter file found: ${routerRelPath}\n`);

          if (options.register) {
            if (registrationResult?.registered) {
              if (options.dryRun) {
                process.stdout.write(`  [DRY RUN] Would register route in ${routerRelPath}\n`);
              } else {
                process.stdout.write(`  + REGISTERED route in ${routerRelPath}\n`);
              }
            } else {
              process.stdout.write(
                `  ! Could not auto-register: "// lumen:routes" marker comment not found in ${routerRelPath}\n`
              );
              process.stdout.write(`\nAdd this route snippet manually:\n\n${snippet.fullSnippet}\n\n`);
            }
          } else {
            process.stdout.write(`\nRoute snippet to add:\n\n${snippet.fullSnippet}\n\n`);
            process.stdout.write(
              `Tip: Run with --register to automatically insert into router files containing "// lumen:routes".\n`
            );
          }
        }
      }

      return {
        ...genResult,
        routerFile: routerFilePath ? path.relative(root, routerFilePath) : null,
        routeSnippet: snippet.fullSnippet,
        registration: registrationResult,
      };
    });
}
