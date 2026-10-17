import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { loadValidFixtures } from 'create-lumen/schema/fixtures/index.js';
import {
  resolveTarget,
  assertPathContained,
  interpolatePath,
  planGenerator,
  applyPlan,
  runGenerator,
} from '../../src/generators/core.js';
import { LumenError, EXIT } from '../../src/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXAMPLE_TEMPLATE_DIR = path.resolve(__dirname, '../../templates/_core-example');

describe('generator core', () => {
  let tmpDir;
  let stdoutOutput;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumen-gen-core-test-'));
    stdoutOutput = '';

    vi.spyOn(process.stdout, 'write').mockImplementation((str) => {
      stdoutOutput += str;
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe('resolveTarget', () => {
    it('returns target directory from manifest.paths only', () => {
      const paths = {
        features: 'src/features',
        components: 'custom/components',
        services: 'src/services',
      };

      expect(resolveTarget(paths, 'features', 'auth')).toBe('src/features');
      expect(resolveTarget(paths, 'components', 'button')).toBe('custom/components');
    });

    it('throws LumenError when kind is not defined in manifest paths', () => {
      const paths = {
        features: 'src/features',
      };

      expect(() => resolveTarget(paths, 'unknown-kind', 'test')).toThrow(LumenError);
      try {
        resolveTarget(paths, 'unknown-kind', 'test');
      } catch (err) {
        expect(err.code).toBe(EXIT.USER);
        expect(err.message).toContain('Unknown generator kind "unknown-kind"');
      }
    });

    it('rejects traversal names in resolveTarget validation', () => {
      const paths = { features: 'src/features' };
      expect(() => resolveTarget(paths, 'features', '../traversal')).toThrow(LumenError);
    });
  });

  describe('assertPathContained', () => {
    it('accepts paths within root', () => {
      const root = '/path/to/project';
      expect(() => assertPathContained(root, '/path/to/project/src/features/auth.ts')).not.toThrow();
    });

    it('rejects paths escaping root with relative traversal', () => {
      const root = '/path/to/project';
      expect(() => assertPathContained(root, '/path/to/project/../evil.txt')).toThrow(LumenError);
      expect(() => assertPathContained(root, '/etc/passwd')).toThrow(LumenError);
    });
  });

  describe('interpolatePath', () => {
    it('replaces __key__ placeholders in paths', () => {
      const templatePath = 'sub/__name__/__Name__.ts';
      const interpolated = interpolatePath(templatePath, {
        name: 'user-profile',
        Name: 'UserProfile',
      });
      expect(interpolated).toBe('sub/user-profile/UserProfile.ts');
    });
  });

  describe('planGenerator & applyPlan', () => {
    it('dryRun prints plan and writes nothing to disk', async () => {
      const manifest = {
        tooling: { language: 'ts' },
      };
      const vars = { name: 'demo', Name: 'Demo', nameCamel: 'demo' };
      const plan = planGenerator({
        templateDir: EXAMPLE_TEMPLATE_DIR,
        vars,
        targetDir: 'src/features',
        manifest,
        root: tmpDir,
      });

      expect(plan.length).toBe(2);
      expect(plan[0].action).toBe('create');

      const result = applyPlan(plan, { dryRun: true });
      expect(result.created.length).toBe(2);

      // Verify nothing written on disk
      expect(fs.existsSync(path.join(tmpDir, 'src/features/demo.ts'))).toBe(false);
      expect(fs.existsSync(path.join(tmpDir, 'src/features/Demo.tsx'))).toBe(false);
    });

    it('writes files to disk on applyPlan', () => {
      const manifest = {
        tooling: { language: 'ts' },
      };
      const vars = { name: 'demo', Name: 'Demo', nameCamel: 'demo', nameKebab: 'demo' };
      const plan = planGenerator({
        templateDir: EXAMPLE_TEMPLATE_DIR,
        vars,
        targetDir: 'src/features',
        manifest,
        root: tmpDir,
      });

      const result = applyPlan(plan, { dryRun: false });
      expect(result.created.length).toBe(2);
      expect(result.skipped.length).toBe(0);

      const createdFile = path.join(tmpDir, 'src/features/demo.ts');
      expect(fs.existsSync(createdFile)).toBe(true);
      expect(fs.readFileSync(createdFile, 'utf8')).toContain('kind: \'ts-module\'');
    });

    it('re-run skips existing files without force', () => {
      const manifest = {
        tooling: { language: 'ts' },
      };
      const vars = { name: 'demo', Name: 'Demo', nameCamel: 'demo', nameKebab: 'demo' };
      const plan1 = planGenerator({
        templateDir: EXAMPLE_TEMPLATE_DIR,
        vars,
        targetDir: 'src/features',
        manifest,
        root: tmpDir,
      });
      applyPlan(plan1, { dryRun: false });

      // Second run without force
      const plan2 = planGenerator({
        templateDir: EXAMPLE_TEMPLATE_DIR,
        vars,
        targetDir: 'src/features',
        manifest,
        root: tmpDir,
      });
      const result2 = applyPlan(plan2, { dryRun: false, force: false });

      expect(result2.created.length).toBe(0);
      expect(result2.skipped.length).toBe(2);
    });

    it('re-run overwrites existing files when force is true', () => {
      const manifest = {
        tooling: { language: 'ts' },
      };
      const vars = { name: 'demo', Name: 'Demo', nameCamel: 'demo', nameKebab: 'demo' };
      const plan1 = planGenerator({
        templateDir: EXAMPLE_TEMPLATE_DIR,
        vars,
        targetDir: 'src/features',
        manifest,
        root: tmpDir,
      });
      applyPlan(plan1, { dryRun: false });

      // Run with force
      const plan2 = planGenerator({
        templateDir: EXAMPLE_TEMPLATE_DIR,
        vars,
        targetDir: 'src/features',
        manifest,
        root: tmpDir,
      });
      const result2 = applyPlan(plan2, { dryRun: false, force: true });

      expect(result2.overwritten.length).toBe(2);
      expect(result2.skipped.length).toBe(0);
    });
  });

  describe('runGenerator with create-lumen fixtures', () => {
    it('emits files in TypeScript and feature-based preset at manifest.paths', async () => {
      const fixtures = await loadValidFixtures();
      // Find a feature-based ts fixture
      const fixture = fixtures.find(
        (f) => f.manifest.architecture?.preset === 'feature-based' && f.manifest.tooling?.language === 'ts'
      ) || fixtures[0];

      fs.writeFileSync(
        path.join(tmpDir, 'lumen.config.json'),
        JSON.stringify(fixture.manifest, null, 2)
      );

      const result = await runGenerator({
        kind: 'features',
        name: 'billing',
        templateDir: EXAMPLE_TEMPLATE_DIR,
        options: { cwd: tmpDir },
      });

      expect(result.created.length).toBe(2);
      expect(result.targetDir).toBe(fixture.manifest.paths.features);

      const tsFile = path.join(tmpDir, fixture.manifest.paths.features, 'billing.ts');
      const tsxFile = path.join(tmpDir, fixture.manifest.paths.features, 'Billing.tsx');
      expect(fs.existsSync(tsFile)).toBe(true);
      expect(fs.existsSync(tsxFile)).toBe(true);

      const content = fs.readFileSync(tsFile, 'utf8');
      expect(content).toContain('name: \'billing\'');
      expect(content).toContain('kind: \'ts-module\'');
    });

    it('emits files in JavaScript and type-based preset at manifest.paths', async () => {
      const fixtures = await loadValidFixtures();
      // Find a type-based js fixture or modify a fixture
      const baseFixture = fixtures.find((f) => f.manifest.architecture?.preset === 'type-based') || fixtures[0];
      const jsManifest = JSON.parse(JSON.stringify(baseFixture.manifest));
      jsManifest.tooling.language = 'js';
      jsManifest.architecture = { preset: 'type-based', validation: 'strict' };
      jsManifest.paths = {
        features: 'src/features',
        components: 'src/components',
        services: 'src/services',
        hooks: 'src/hooks',
        pages: 'src/pages',
        ui: 'src/ui',
      };

      fs.writeFileSync(
        path.join(tmpDir, 'lumen.config.json'),
        JSON.stringify(jsManifest, null, 2)
      );

      const result = await runGenerator({
        kind: 'components',
        name: 'header-nav',
        templateDir: EXAMPLE_TEMPLATE_DIR,
        options: { cwd: tmpDir },
      });

      expect(result.created.length).toBe(2);
      expect(result.targetDir).toBe('src/components');

      const jsFile = path.join(tmpDir, 'src/components/header-nav.js');
      const jsxFile = path.join(tmpDir, 'src/components/HeaderNav.jsx');
      expect(fs.existsSync(jsFile)).toBe(true);
      expect(fs.existsSync(jsxFile)).toBe(true);

      const content = fs.readFileSync(jsFile, 'utf8');
      expect(content).toContain('name: \'header-nav\'');
      expect(content).toContain('kind: \'js-module\'');
    });

    it('honors --dry-run option and writes no files', async () => {
      const fixtures = await loadValidFixtures();
      fs.writeFileSync(
        path.join(tmpDir, 'lumen.config.json'),
        JSON.stringify(fixtures[0].manifest, null, 2)
      );

      const result = await runGenerator({
        kind: 'features',
        name: 'payments',
        templateDir: EXAMPLE_TEMPLATE_DIR,
        options: { cwd: tmpDir, dryRun: true },
      });

      expect(result.created.length).toBe(2);
      expect(stdoutOutput).toContain('[DRY RUN]');
      expect(fs.existsSync(path.join(tmpDir, 'src/features/payments.ts'))).toBe(false);
    });

    it('honors --json option and writes structured JSON to stdout', async () => {
      const fixtures = await loadValidFixtures();
      fs.writeFileSync(
        path.join(tmpDir, 'lumen.config.json'),
        JSON.stringify(fixtures[0].manifest, null, 2)
      );

      const result = await runGenerator({
        kind: 'features',
        name: 'orders',
        templateDir: EXAMPLE_TEMPLATE_DIR,
        options: { cwd: tmpDir, json: true },
      });

      expect(result.created.length).toBe(2);
      const parsedOutput = JSON.parse(stdoutOutput.trim());
      expect(parsedOutput.success).toBe(true);
      expect(parsedOutput.name).toBe('orders');
      expect(parsedOutput.created.length).toBe(2);
    });

    it('rejects traversal names with LumenError', async () => {
      const fixtures = await loadValidFixtures();
      fs.writeFileSync(
        path.join(tmpDir, 'lumen.config.json'),
        JSON.stringify(fixtures[0].manifest, null, 2)
      );

      await expect(
        runGenerator({
          kind: 'features',
          name: '../../escape',
          templateDir: EXAMPLE_TEMPLATE_DIR,
          options: { cwd: tmpDir },
        })
      ).rejects.toThrow(LumenError);
    });
  });
});
