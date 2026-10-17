import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadValidFixtures } from 'create-lumen/schema/fixtures/index.js';
import { createCli } from '../../src/cli.js';
import { LumenError } from '../../src/errors.js';

describe('lumen g page command', () => {
  let tmpDir;
  let stdoutOutput;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumen-gen-page-test-'));
    stdoutOutput = '';

    vi.spyOn(process.stdout, 'write').mockImplementation((str) => {
      stdoutOutput += str;
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('scaffolds a route page in TypeScript for feature-based preset at paths.pages', async () => {
    const fixtures = await loadValidFixtures();
    const fixture = fixtures.find(
      (f) =>
        f.manifest.framework?.name === 'react' &&
        f.manifest.architecture?.preset === 'feature-based' &&
        f.manifest.tooling?.language === 'ts'
    );
    expect(fixture).toBeDefined();

    fs.writeFileSync(
      path.join(tmpDir, 'lumen.config.json'),
      JSON.stringify(fixture.manifest, null, 2)
    );

    const program = createCli();
    await program.parseAsync(['node', 'lumen', '-c', tmpDir, 'generate', 'page', 'billing-dashboard']);

    const targetDir = fixture.manifest.paths.pages;
    const pageFile = path.join(tmpDir, targetDir, 'BillingDashboardPage.tsx');

    expect(fs.existsSync(pageFile)).toBe(true);
    const content = fs.readFileSync(pageFile, 'utf8');
    expect(content).toContain('export function BillingDashboardPage()');
    expect(content).toContain('export default BillingDashboardPage;');
    expect(content).toContain('data-testid="billing-dashboard-page"');
  });

  it('scaffolds a route page in JavaScript for type-based preset at paths.pages', async () => {
    const fixtures = await loadValidFixtures();
    const baseFixture = fixtures.find(
      (f) => f.manifest.framework?.name === 'react' && f.manifest.paths?.pages === 'src/pages'
    ) || fixtures[0];

    const jsManifest = JSON.parse(JSON.stringify(baseFixture.manifest));
    jsManifest.tooling.language = 'js';
    jsManifest.framework = { name: 'react', variant: 'vite' };
    jsManifest.paths = {
      ...jsManifest.paths,
      pages: 'src/pages',
    };

    fs.writeFileSync(
      path.join(tmpDir, 'lumen.config.json'),
      JSON.stringify(jsManifest, null, 2)
    );

    const program = createCli();
    await program.parseAsync(['node', 'lumen', '-c', tmpDir, 'g', 'page', 'user-profile']);

    const pageFile = path.join(tmpDir, 'src/pages/UserProfilePage.jsx');
    expect(fs.existsSync(pageFile)).toBe(true);
    const content = fs.readFileSync(pageFile, 'utf8');
    expect(content).toContain('export function UserProfilePage()');
    expect(content).toContain('export default UserProfilePage;');
  });

  it('honors --dry-run option and writes no files to disk', async () => {
    const fixtures = await loadValidFixtures();
    const fixture = fixtures.find((f) => f.manifest.framework?.name === 'react');

    fs.writeFileSync(
      path.join(tmpDir, 'lumen.config.json'),
      JSON.stringify(fixture.manifest, null, 2)
    );

    const program = createCli();
    await program.parseAsync(['node', 'lumen', '-c', tmpDir, 'g', 'page', 'analytics', '--dry-run']);

    expect(stdoutOutput).toContain('[DRY RUN]');
    const pageFile = path.join(tmpDir, fixture.manifest.paths.pages, 'AnalyticsPage.tsx');
    expect(fs.existsSync(pageFile)).toBe(false);
  });

  it('skips existing page files without --force, and overwrites with --force', async () => {
    const fixtures = await loadValidFixtures();
    const fixture = fixtures.find((f) => f.manifest.framework?.name === 'react');

    fs.writeFileSync(
      path.join(tmpDir, 'lumen.config.json'),
      JSON.stringify(fixture.manifest, null, 2)
    );

    const pageFile = path.join(tmpDir, fixture.manifest.paths.pages, 'ReportsPage.tsx');
    fs.mkdirSync(path.dirname(pageFile), { recursive: true });
    fs.writeFileSync(pageFile, '// custom user code', 'utf8');

    // First run without force -> skipped
    const program1 = createCli();
    await program1.parseAsync(['node', 'lumen', '-c', tmpDir, 'g', 'page', 'reports']);

    expect(fs.readFileSync(pageFile, 'utf8')).toBe('// custom user code');
    expect(stdoutOutput).toContain('- SKIP');

    // Second run with --force -> overwritten
    const program2 = createCli();
    await program2.parseAsync(['node', 'lumen', '-c', tmpDir, 'g', 'page', 'reports', '--force']);

    expect(stdoutOutput).toContain('! OVERWRITE');
    expect(fs.readFileSync(pageFile, 'utf8')).toContain('export function ReportsPage()');
  });

  it('throws LumenError when project framework is Next.js with reference to issue #32', async () => {
    const fixtures = await loadValidFixtures();
    const nextFixture = fixtures.find((f) => f.manifest.framework?.name === 'next');
    expect(nextFixture).toBeDefined();

    fs.writeFileSync(
      path.join(tmpDir, 'lumen.config.json'),
      JSON.stringify(nextFixture.manifest, null, 2)
    );

    const program = createCli();
    await expect(
      program.parseAsync(['node', 'lumen', '-c', tmpDir, 'g', 'page', 'settings'])
    ).rejects.toThrow(LumenError);

    try {
      await program.parseAsync(['node', 'lumen', '-c', tmpDir, 'g', 'page', 'settings']);
    } catch (err) {
      expect(err.message).toContain('Next.js page generation is tracked in issue #32');
      expect(err.hint).toContain('#32');
    }
  });

  it('prints route snippet when router file exists without --register', async () => {
    const fixtures = await loadValidFixtures();
    const fixture = fixtures.find((f) => f.manifest.framework?.name === 'react');

    fs.writeFileSync(
      path.join(tmpDir, 'lumen.config.json'),
      JSON.stringify(fixture.manifest, null, 2)
    );

    const pagesDir = path.join(tmpDir, fixture.manifest.paths.pages);
    fs.mkdirSync(pagesDir, { recursive: true });
    fs.writeFileSync(
      path.join(pagesDir, 'routes.tsx'),
      'export const routes = [];\n',
      'utf8'
    );

    const program = createCli();
    await program.parseAsync(['node', 'lumen', '-c', tmpDir, 'g', 'page', 'orders']);

    expect(stdoutOutput).toContain('Router file found:');
    expect(stdoutOutput).toContain("path: '/orders', element: <OrdersPage />");
    expect(stdoutOutput).toContain("import { OrdersPage } from './OrdersPage';");
    expect(fs.readFileSync(path.join(pagesDir, 'routes.tsx'), 'utf8')).toBe('export const routes = [];\n');
  });

  it('auto-registers route when --register is passed and // lumen:routes comment exists', async () => {
    const fixtures = await loadValidFixtures();
    const fixture = fixtures.find((f) => f.manifest.framework?.name === 'react');

    fs.writeFileSync(
      path.join(tmpDir, 'lumen.config.json'),
      JSON.stringify(fixture.manifest, null, 2)
    );

    const pagesDir = path.join(tmpDir, fixture.manifest.paths.pages);
    fs.mkdirSync(pagesDir, { recursive: true });
    const routerPath = path.join(pagesDir, 'routes.tsx');
    fs.writeFileSync(
      routerPath,
      `export const routes = [
  // lumen:routes
];\n`,
      'utf8'
    );

    const program = createCli();
    await program.parseAsync(['node', 'lumen', '-c', tmpDir, 'g', 'page', 'customers', '--register']);

    expect(stdoutOutput).toContain('+ REGISTERED route in');
    const updatedContent = fs.readFileSync(routerPath, 'utf8');
    expect(updatedContent).toContain("import { CustomersPage } from './CustomersPage';");
    expect(updatedContent).toContain("path: '/customers', element: <CustomersPage />");
  });

  it('falls back to printing snippet with warning when --register is passed but // lumen:routes comment is missing', async () => {
    const fixtures = await loadValidFixtures();
    const fixture = fixtures.find((f) => f.manifest.framework?.name === 'react');

    fs.writeFileSync(
      path.join(tmpDir, 'lumen.config.json'),
      JSON.stringify(fixture.manifest, null, 2)
    );

    const pagesDir = path.join(tmpDir, fixture.manifest.paths.pages);
    fs.mkdirSync(pagesDir, { recursive: true });
    const routerPath = path.join(pagesDir, 'routes.tsx');
    fs.writeFileSync(routerPath, 'export const routes = [];\n', 'utf8');

    const program = createCli();
    await program.parseAsync(['node', 'lumen', '-c', tmpDir, 'g', 'page', 'invoices', '--register']);

    expect(stdoutOutput).toContain('Could not auto-register: "// lumen:routes" marker comment not found');
    expect(stdoutOutput).toContain("path: '/invoices', element: <InvoicesPage />");
  });

  it('outputs valid JSON when -j / --json is passed', async () => {
    const fixtures = await loadValidFixtures();
    const fixture = fixtures.find((f) => f.manifest.framework?.name === 'react');

    fs.writeFileSync(
      path.join(tmpDir, 'lumen.config.json'),
      JSON.stringify(fixture.manifest, null, 2)
    );

    const program = createCli();
    await program.parseAsync(['node', 'lumen', '-c', tmpDir, '-j', 'g', 'page', 'checkout']);

    const parsed = JSON.parse(stdoutOutput.trim());
    expect(parsed.success).toBe(true);
    expect(parsed.kind).toBe('pages');
    expect(parsed.name).toBe('checkout');
    expect(parsed.created.length).toBe(1);
  });

  it('smokes test that emitted tsx file is syntactically valid React', async () => {
    let ts;
    try {
      ts = await import('typescript');
    } catch {
      ts = null;
    }

    if (ts && ts.default?.transpileModule) {
      const templatePath = path.resolve(__dirname, '../../templates/page/__Name__Page.tsx.tpl');
      const raw = fs.readFileSync(templatePath, 'utf8');
      const rendered = raw.replaceAll('{{Name}}', 'Test').replaceAll('{{nameKebab}}', 'test');
      const transpiled = ts.default.transpileModule(rendered, {
        compilerOptions: { jsx: ts.default.JsxEmit.ReactJSX },
      });
      expect(transpiled.outputText).toBeDefined();
    }
  });
});
