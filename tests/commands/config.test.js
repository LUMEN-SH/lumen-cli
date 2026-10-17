import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadValidFixtures } from 'create-lumen/schema/fixtures/index.js';
import { runCli, createCli } from '../../src/cli.js';

describe('lumen config command', () => {
  let tmpDir;
  let stdoutOutput;
  let stderrOutput;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumen-config-test-'));
    stdoutOutput = '';
    stderrOutput = '';
    process.exitCode = undefined;

    vi.spyOn(process.stdout, 'write').mockImplementation((str) => {
      stdoutOutput += str;
      return true;
    });

    vi.spyOn(process.stderr, 'write').mockImplementation((str) => {
      stderrOutput += str;
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

  it('displays help and examples for config, get, and validate', () => {
    const program = createCli().exitOverride();
    let helpOutput = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((str) => {
      helpOutput += str;
      return true;
    });

    try {
      program.parse(['node', 'lumen', 'config', '--help']);
    } catch {
      // ignore Commander exit
    }

    expect(helpOutput).toContain('Usage: lumen config [options] [command]');
    expect(helpOutput).toContain('Examples:');
    expect(helpOutput).toContain('$ lumen config');
    expect(helpOutput).toContain('$ lumen config get architecture.preset');
    expect(helpOutput).toContain('$ lumen config validate');
  });

  it('prints human summary for valid configuration', async () => {
    const validFixtures = await loadValidFixtures();
    const manifest = validFixtures[0].manifest;
    fs.writeFileSync(path.join(tmpDir, 'lumen.config.json'), JSON.stringify(manifest, null, 2));

    runCli(['node', 'lumen', '-c', tmpDir, 'config']);

    expect(process.exitCode).toBeUndefined();
    expect(stdoutOutput).toContain('Configuration:');
    expect(stdoutOutput).toContain('Framework:');
    expect(stdoutOutput).toContain('Styling:');
    expect(stdoutOutput).toContain('Architecture:');
    expect(stdoutOutput).toContain('Resolved Paths:');
    expect(stdoutOutput).toContain('features:');
  });

  it('prints json output when -j / --json is provided', async () => {
    const validFixtures = await loadValidFixtures();
    const manifest = validFixtures[0].manifest;
    fs.writeFileSync(path.join(tmpDir, 'lumen.config.json'), JSON.stringify(manifest, null, 2));

    runCli(['node', 'lumen', '-c', tmpDir, '-j', 'config']);

    expect(process.exitCode).toBeUndefined();
    const parsed = JSON.parse(stdoutOutput.trim());
    expect(parsed).toHaveProperty('file');
    expect(parsed).toHaveProperty('root');
    expect(parsed).toHaveProperty('manifest');
    expect(parsed).toHaveProperty('paths');
    expect(parsed.manifest.manifestVersion).toBe(2);
  });

  it('retrieves nested string value with lumen config get <dotted.path>', async () => {
    const validFixtures = await loadValidFixtures();
    const manifest = validFixtures[0].manifest;
    fs.writeFileSync(path.join(tmpDir, 'lumen.config.json'), JSON.stringify(manifest, null, 2));

    runCli(['node', 'lumen', '-c', tmpDir, 'config', 'get', 'architecture.preset']);

    expect(process.exitCode).toBeUndefined();
    expect(stdoutOutput.trim()).toBe(manifest.architecture.type || manifest.architecture.preset);
  });

  it('retrieves nested object with lumen config get <dotted.path> formatted as JSON', async () => {
    const validFixtures = await loadValidFixtures();
    const manifest = validFixtures[0].manifest;
    fs.writeFileSync(path.join(tmpDir, 'lumen.config.json'), JSON.stringify(manifest, null, 2));

    runCli(['node', 'lumen', '-c', tmpDir, 'config', 'get', 'paths']);

    expect(process.exitCode).toBeUndefined();
    const parsed = JSON.parse(stdoutOutput.trim());
    expect(parsed).toHaveProperty('features');
    expect(parsed).toHaveProperty('components');
  });

  it('fails with exit code 1 and hint when getting a non-existent key', async () => {
    const validFixtures = await loadValidFixtures();
    const manifest = validFixtures[0].manifest;
    fs.writeFileSync(path.join(tmpDir, 'lumen.config.json'), JSON.stringify(manifest, null, 2));

    runCli(['node', 'lumen', '-c', tmpDir, 'config', 'get', 'nonexistent.key']);

    expect(process.exitCode).toBe(1);
    expect(stderrOutput).toContain("Error: Key 'nonexistent.key' not found in configuration");
    expect(stderrOutput).toContain('Hint:');
  });

  it('fails with exit code 1 and hint in json mode when getting a non-existent key', async () => {
    const validFixtures = await loadValidFixtures();
    const manifest = validFixtures[0].manifest;
    fs.writeFileSync(path.join(tmpDir, 'lumen.config.json'), JSON.stringify(manifest, null, 2));

    runCli(['node', 'lumen', '-c', tmpDir, '-j', 'config', 'get', 'missing.key']);

    expect(process.exitCode).toBe(1);
    const parsed = JSON.parse(stderrOutput.trim());
    expect(parsed.code).toBe(1);
    expect(parsed.error).toContain("Key 'missing.key' not found in configuration");
    expect(parsed.hint).toBeDefined();
  });

  it('validates a valid configuration with OK', async () => {
    const validFixtures = await loadValidFixtures();
    const manifest = validFixtures[0].manifest;
    fs.writeFileSync(path.join(tmpDir, 'lumen.config.json'), JSON.stringify(manifest, null, 2));

    runCli(['node', 'lumen', '-c', tmpDir, 'config', 'validate']);

    expect(process.exitCode).toBeUndefined();
    expect(stdoutOutput.trim()).toBe('OK');
  });

  it('validates a valid configuration with json status when -j is passed', async () => {
    const validFixtures = await loadValidFixtures();
    const manifest = validFixtures[0].manifest;
    fs.writeFileSync(path.join(tmpDir, 'lumen.config.json'), JSON.stringify(manifest, null, 2));

    runCli(['node', 'lumen', '-c', tmpDir, '-j', 'config', 'validate']);

    expect(process.exitCode).toBeUndefined();
    const parsed = JSON.parse(stdoutOutput.trim());
    expect(parsed).toEqual({ status: 'ok', valid: true });
  });

  it('exits with code 2 when config is missing', () => {
    runCli(['node', 'lumen', '-c', tmpDir, 'config']);

    expect(process.exitCode).toBe(2);
    expect(stderrOutput).toContain('Could not find lumen.config.json');
  });

  it('exits with code 2 when validating missing config', () => {
    runCli(['node', 'lumen', '-c', tmpDir, 'config', 'validate']);

    expect(process.exitCode).toBe(2);
    expect(stderrOutput).toContain('Could not find lumen.config.json');
  });

  it('exits with code 2 and migration hint when reading v1 config', () => {
    const v1Config = {
      framework: 'react',
      css: 'tailwind',
      architecture: 'feature-based',
    };
    fs.writeFileSync(path.join(tmpDir, 'lumen.config.json'), JSON.stringify(v1Config));

    runCli(['node', 'lumen', '-c', tmpDir, 'config']);

    expect(process.exitCode).toBe(2);
    expect(stderrOutput).toContain('docs/migration/v1-to-v2.md');
  });
});
