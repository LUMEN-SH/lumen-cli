import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { resolveScaffolderBin, runScaffolder } from '../src/scaffolder.js';
import { LumenError, EXIT } from '../src/errors.js';

describe('scaffolder module', () => {
  describe('resolveScaffolderBin', () => {
    it('resolves create-lumen bin path correctly', () => {
      const binPath = resolveScaffolderBin();
      expect(binPath).toBeDefined();
      expect(binPath).toContain('create-lumen');
      expect(binPath.endsWith('bin/cli.js')).toBe(true);
    });

    it('throws LumenError when create-lumen cannot be resolved', () => {
      expect(() => {
        resolveScaffolderBin('file:///nonexistent-directory/package.json');
      }).toThrow(LumenError);

      try {
        resolveScaffolderBin('file:///nonexistent-directory/package.json');
      } catch (err) {
        expect(err.message).toBe('create-lumen is not installed');
        expect(err.code).toBe(EXIT.USER);
        expect(err.hint).toBe('npm i create-lumen@^2');
      }
    });
  });

  describe('runScaffolder', () => {
    it('spawns bin with process.execPath, stdio inherit, given cwd and args', async () => {
      let spawnCalledWith;
      const fakeChild = new EventEmitter();
      fakeChild.killed = false;
      fakeChild.kill = vi.fn();

      const mockSpawn = (cmd, args, opts) => {
        spawnCalledWith = { cmd, args, opts };
        queueMicrotask(() => {
          fakeChild.emit('close', 0, null);
        });
        return fakeChild;
      };

      const code = await runScaffolder(['my-app', '--yes'], {
        cwd: '/test/custom/dir',
        spawn: mockSpawn,
      });

      expect(code).toBe(0);
      expect(spawnCalledWith.cmd).toBe(process.execPath);
      expect(spawnCalledWith.args[0]).toContain('create-lumen');
      expect(spawnCalledWith.args.slice(1)).toEqual(['my-app', '--yes']);
      expect(spawnCalledWith.opts).toEqual({
        stdio: 'inherit',
        cwd: '/test/custom/dir',
      });
    });

    it('resolves non-zero exit codes from child', async () => {
      const fakeChild = new EventEmitter();
      const mockSpawn = () => {
        queueMicrotask(() => {
          fakeChild.emit('close', 2, null);
        });
        return fakeChild;
      };

      const code = await runScaffolder([], { spawn: mockSpawn });
      expect(code).toBe(2);
    });

    it('maps SIGINT signal to exit code 130', async () => {
      const fakeChild = new EventEmitter();
      const mockSpawn = () => {
        queueMicrotask(() => {
          fakeChild.emit('close', null, 'SIGINT');
        });
        return fakeChild;
      };

      const code = await runScaffolder([], { spawn: mockSpawn });
      expect(code).toBe(130);
    });

    it('maps SIGTERM signal to exit code 143', async () => {
      const fakeChild = new EventEmitter();
      const mockSpawn = () => {
        queueMicrotask(() => {
          fakeChild.emit('close', null, 'SIGTERM');
        });
        return fakeChild;
      };

      const code = await runScaffolder([], { spawn: mockSpawn });
      expect(code).toBe(143);
    });

    it('forwards SIGINT and SIGTERM to child process', async () => {
      const fakeChild = new EventEmitter();
      fakeChild.killed = false;
      fakeChild.kill = vi.fn();

      const mockSpawn = () => {
        queueMicrotask(() => {
          process.emit('SIGINT');
          process.emit('SIGTERM');
          fakeChild.emit('close', 130, 'SIGINT');
        });
        return fakeChild;
      };

      const code = await runScaffolder([], { spawn: mockSpawn });
      expect(code).toBe(130);
      expect(fakeChild.kill).toHaveBeenCalledWith('SIGINT');
      expect(fakeChild.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('rejects on spawn error event', async () => {
      const fakeChild = new EventEmitter();
      const mockSpawn = () => {
        queueMicrotask(() => {
          fakeChild.emit('error', new Error('spawn ENOENT'));
        });
        return fakeChild;
      };

      await expect(runScaffolder([], { spawn: mockSpawn })).rejects.toThrow('spawn ENOENT');
    });
  });
});
