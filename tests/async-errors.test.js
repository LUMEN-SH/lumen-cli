import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VALID_FIXTURES_DIR } from 'create-lumen/schema/fixtures/index.js';

const BIN = fileURLToPath(new URL('../bin/lumen.js', import.meta.url));

function run(args, cwd) {
  return spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8' });
}

describe('errors thrown by async commands', () => {
  it('prints a clean message and exit code 1, never a stack trace', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumen-async-err-'));
    try {
      fs.copyFileSync(
        path.join(VALID_FIXTURES_DIR, 'react-vite-none.json'),
        path.join(dir, 'lumen.config.json')
      );
      const res = run(['g', 'feature', 'billing'], dir);
      expect(res.status).toBe(1);
      expect(res.stderr).toMatch(/^Error: Cannot generate feature/m);
      expect(res.stderr).not.toMatch(/\n\s+at /);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('maps an invalid flag in create to exit code 1 with a clean message', () => {
    const res = run(['create', 'x', '--linter', 'nope']);
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/^Error: Invalid linter "nope"/m);
    expect(res.stderr).not.toMatch(/\n\s+at /);
  });

  it('emits JSON errors with --json', () => {
    const res = run(['create', 'x', '--linter', 'nope', '--json']);
    expect(res.status).toBe(1);
    expect(JSON.parse(res.stderr.trim().split('\n')[0]).code).toBe(1);
  });
});
