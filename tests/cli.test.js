import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCli, runCli, getPackageJson } from '../src/cli.js';

describe('lumen-cli bootstrap', () => {
  let pkg;

  beforeEach(() => {
    pkg = getPackageJson();
  });

  it('should load valid package.json with version and ESM type', () => {
    expect(pkg.name).toBe('lumen-cli');
    expect(pkg.type).toBe('module');
    expect(pkg.version).toBeDefined();
    expect(pkg.bin).toEqual({
      lumen: './bin/lumen.js',
      lm: './bin/lumen.js',
    });
  });

  it('createCli creates commander program with lumen name and package version', () => {
    const program = createCli();
    expect(program.name()).toBe('lumen');
    expect(program.version()).toBe(pkg.version);
  });

  it('runCli creates and parses program', () => {
    const program = runCli(['node', 'lumen']);
    expect(program.name()).toBe('lumen');
  });

  describe('CLI help and version output', () => {
    let output = '';
    let exitCode = null;

    beforeEach(() => {
      output = '';
      exitCode = null;

      vi.spyOn(process.stdout, 'write').mockImplementation((str) => {
        output += str;
        return true;
      });

      vi.spyOn(process.stderr, 'write').mockImplementation((str) => {
        output += str;
        return true;
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('outputs help text when called with --help', () => {
      const program = createCli();
      program.exitOverride();

      try {
        program.parse(['node', 'lumen', '--help']);
      } catch (e) {
        exitCode = e.exitCode;
      }

      expect(exitCode).toBe(0);
      expect(output).toContain('Usage: lumen [options]');
      expect(output).toContain('-h, --help');
      expect(output).toContain('-V, --version');
    });

    it('outputs help text when called with -h', () => {
      const program = createCli();
      program.exitOverride();

      try {
        program.parse(['node', 'lumen', '-h']);
      } catch (e) {
        exitCode = e.exitCode;
      }

      expect(exitCode).toBe(0);
      expect(output).toContain('Usage: lumen [options]');
    });

    it('outputs version when called with --version', () => {
      const program = createCli();
      program.exitOverride();

      try {
        program.parse(['node', 'lumen', '--version']);
      } catch (e) {
        exitCode = e.exitCode;
      }

      expect(exitCode).toBe(0);
      expect(output.trim()).toBe(pkg.version);
    });

    it('outputs version when called with -V', () => {
      const program = createCli();
      program.exitOverride();

      try {
        program.parse(['node', 'lumen', '-V']);
      } catch (e) {
        exitCode = e.exitCode;
      }

      expect(exitCode).toBe(0);
      expect(output.trim()).toBe(pkg.version);
    });

    it('short alias -h equals --help output', () => {
      const prog1 = createCli().exitOverride();
      let outHelp = '';
      vi.spyOn(process.stdout, 'write').mockImplementation((str) => {
        outHelp += str;
        return true;
      });
      try {
        prog1.parse(['node', 'lumen', '--help']);
      } catch {
        // expected Commander exit override
      }

      const prog2 = createCli().exitOverride();
      let outShortH = '';
      vi.spyOn(process.stdout, 'write').mockImplementation((str) => {
        outShortH += str;
        return true;
      });
      try {
        prog2.parse(['node', 'lumen', '-h']);
      } catch {
        // expected Commander exit override
      }

      expect(outShortH).toBe(outHelp);
    });

    it('short alias -V equals --version output', () => {
      const prog1 = createCli().exitOverride();
      let outVersion = '';
      vi.spyOn(process.stdout, 'write').mockImplementation((str) => {
        outVersion += str;
        return true;
      });
      try {
        prog1.parse(['node', 'lumen', '--version']);
      } catch {
        // expected Commander exit override
      }

      const prog2 = createCli().exitOverride();
      let outShortV = '';
      vi.spyOn(process.stdout, 'write').mockImplementation((str) => {
        outShortV += str;
        return true;
      });
      try {
        prog2.parse(['node', 'lumen', '-V']);
      } catch {
        // expected Commander exit override
      }

      expect(outShortV).toBe(outVersion);
    });

    it('lm alias resolves identically to lumen', () => {
      const program = createCli();
      program.exitOverride();

      try {
        program.parse(['node', 'lm', '--help']);
      } catch (e) {
        exitCode = e.exitCode;
      }

      expect(exitCode).toBe(0);
      expect(output).toContain('Usage: lumen [options]');
    });
  });
});
