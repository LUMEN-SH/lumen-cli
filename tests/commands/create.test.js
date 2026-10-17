import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCli } from '../../src/cli.js';
import * as scaffolderModule from '../../src/scaffolder.js';

describe('create and init commands', () => {
  let runScaffolderSpy;
  let originalExitCode;

  beforeEach(() => {
    originalExitCode = process.exitCode;
    runScaffolderSpy = vi.spyOn(scaffolderModule, 'runScaffolder').mockResolvedValue(0);
  });

  afterEach(() => {
    runScaffolderSpy.mockRestore();
    process.exitCode = originalExitCode;
  });

  describe('lumen create', () => {
    it('registers create command on program', () => {
      const program = createCli();
      const createCmd = program.commands.find((cmd) => cmd.name() === 'create');
      expect(createCmd).toBeDefined();
      expect(createCmd.description()).toBe('Create a new Lumen project');
    });

    it('forwards project name and flags to scaffolder', async () => {
      const program = createCli().exitOverride();
      await program.parseAsync([
        'node',
        'lumen',
        'create',
        'my-cool-app',
        '-y',
        '-t',
        'react-ts',
        '-m',
        './lumen.config.json',
        '-f',
        'react',
        '-a',
        'feature-based',
      ]);

      expect(runScaffolderSpy).toHaveBeenCalledTimes(1);
      expect(runScaffolderSpy).toHaveBeenCalledWith(
        [
          'my-cool-app',
          '--yes',
          '--manifest',
          './lumen.config.json',
          '--template',
          'react-ts',
          '--framework',
          'react',
          '--arch',
          'feature-based',
        ],
        { cwd: process.cwd() }
      );
    });

    it('handles --architecture as alias for --arch', async () => {
      const program = createCli().exitOverride();
      await program.parseAsync([
        'node',
        'lumen',
        'create',
        'my-app',
        '--architecture',
        'type-based',
      ]);

      expect(runScaffolderSpy).toHaveBeenCalledTimes(1);
      expect(runScaffolderSpy).toHaveBeenCalledWith(
        ['my-app', '--arch', 'type-based'],
        { cwd: process.cwd() }
      );
    });

    it('respects global --cwd option', async () => {
      const program = createCli().exitOverride();
      await program.parseAsync([
        'node',
        'lumen',
        '-c',
        '/custom/workspace',
        'create',
        'app',
        '-y',
      ]);

      expect(runScaffolderSpy).toHaveBeenCalledWith(
        ['app', '--yes'],
        { cwd: '/custom/workspace' }
      );
    });

    it('sets process.exitCode from scaffolder exit code', async () => {
      runScaffolderSpy.mockResolvedValueOnce(42);
      const program = createCli().exitOverride();
      await program.parseAsync(['node', 'lumen', 'create', 'app']);

      expect(process.exitCode).toBe(42);
    });
  });

  describe('lumen init', () => {
    it('registers init command on program', () => {
      const program = createCli();
      const initCmd = program.commands.find((cmd) => cmd.name() === 'init');
      expect(initCmd).toBeDefined();
      expect(initCmd.description()).toBe('Initialize a Lumen project in current directory');
    });

    it('invokes scaffolder without positional name when init is run', async () => {
      const program = createCli().exitOverride();
      await program.parseAsync(['node', 'lumen', 'init', '-y', '-t', 'react-ts']);

      expect(runScaffolderSpy).toHaveBeenCalledTimes(1);
      expect(runScaffolderSpy).toHaveBeenCalledWith(
        ['--yes', '--template', 'react-ts'],
        { cwd: process.cwd() }
      );
    });

    it('forwards --arch / --architecture in init', async () => {
      const program = createCli().exitOverride();
      await program.parseAsync(['node', 'lumen', 'init', '--architecture', 'none']);

      expect(runScaffolderSpy).toHaveBeenCalledTimes(1);
      expect(runScaffolderSpy).toHaveBeenCalledWith(
        ['--arch', 'none'],
        { cwd: process.cwd() }
      );
    });
  });
});
