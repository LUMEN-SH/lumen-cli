import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  loadValidFixtures,
  loadInvalidFixtures,
  INVALID_FIXTURES_DIR,
} from 'create-lumen/schema/fixtures/index.js';
import { readConfig } from '../../src/config/read.js';
import { ConfigError } from '../../src/config/errors.js';

describe('Drift Gate (#29) - create-lumen shared fixtures', () => {
  describe('Valid fixtures', () => {
    it('successfully loads and validates every valid fixture via readConfig in tmpdir', async () => {
      const validFixtures = await loadValidFixtures();
      expect(validFixtures.length).toBeGreaterThan(0);

      for (const { name, manifest } of validFixtures) {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `lumen-fixture-${name}-`));
        const configFile = path.join(tmpDir, 'lumen.config.json');

        try {
          fs.writeFileSync(configFile, JSON.stringify(manifest, null, 2), 'utf8');

          const result = readConfig({ cwd: tmpDir });
          expect(result.file).toBe(configFile);
          expect(result.root).toBe(tmpDir);
          expect(result.manifest.manifestVersion).toBe(2);

          // Architecture normalization check
          expect(result.manifest.architecture.preset).toBeDefined();
          expect(result.manifest.architecture.type).toBeDefined();
          expect(result.manifest.architecture.preset).toBe(result.manifest.architecture.type);
          expect(result.manifest.architecture.validation).toMatch(/^(strict|relaxed|none)$/);

          // Harness commands check
          expect(Array.isArray(result.manifest.harness.commands)).toBe(true);

          // Paths check: must be fully populated
          expect(result.paths).toBeDefined();
          expect(typeof result.paths.features).toBe('string');
          expect(typeof result.paths.components).toBe('string');
          expect(typeof result.paths.services).toBe('string');
          expect(typeof result.paths.hooks).toBe('string');
          expect(typeof result.paths.pages).toBe('string');
          expect(typeof result.paths.ui).toBe('string');

          // If fixture had manifest.paths, verify they were preferred
          if (manifest.paths) {
            for (const key of Object.keys(manifest.paths)) {
              expect(result.paths[key]).toBe(manifest.paths[key]);
            }
          }
        } finally {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
      }
    });
  });

  describe('Invalid fixtures', () => {
    async function getInvalidFixturesList() {
      if (typeof loadInvalidFixtures === 'function') {
        return await loadInvalidFixtures();
      }
      const files = fs.readdirSync(INVALID_FIXTURES_DIR).filter((f) => f.endsWith('.json'));
      return files.map((filename) => {
        const filePath = path.join(INVALID_FIXTURES_DIR, filename);
        return {
          name: path.basename(filename, '.json'),
          filename,
          manifest: JSON.parse(fs.readFileSync(filePath, 'utf8')),
        };
      });
    }

    it('rejects every invalid fixture with an actionable ConfigError', async () => {
      const invalidFixtures = await getInvalidFixturesList();
      expect(invalidFixtures.length).toBeGreaterThan(0);

      for (const { name, manifest } of invalidFixtures) {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `lumen-invalid-${name}-`));
        const configFile = path.join(tmpDir, 'lumen.config.json');

        try {
          fs.writeFileSync(configFile, JSON.stringify(manifest, null, 2), 'utf8');

          let threw = false;
          try {
            readConfig({ cwd: tmpDir });
          } catch (err) {
            threw = true;
            expect(err).toBeInstanceOf(ConfigError);
            expect(err.code).toBe('CONFIG');
            expect(err.exitCode).toBe(2);
            expect(err.message.length).toBeGreaterThan(10);

            // Specific check for v1 fixture
            if (name === 'v1-flat-config') {
              expect(err.message).toContain('docs/migration/v1-to-v2.md');
            }

            // Specific check for shadcn without tailwind
            if (name === 'shadcn-without-tailwind') {
              expect(err.message).toMatch(/shadcn.*tailwind/i);
            }

            // Specific check for harness errors
            if (name.startsWith('harness-')) {
              expect(err.message.toLowerCase()).toContain('harness');
            }

            // Specific check for validation mode errors
            if (name.startsWith('invalid-validation-')) {
              expect(err.message.toLowerCase()).toContain('validation');
            }
          }

          expect(
            threw,
            `Expected invalid fixture "${name}" to fail parsing, but it succeeded.`
          ).toBe(true);
        } finally {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
      }
    });
  });
});
