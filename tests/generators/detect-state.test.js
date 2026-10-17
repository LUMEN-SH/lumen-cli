import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { detectStateLib } from '../../src/generators/detect-state.js';

describe('detectStateLib', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumen-detect-state-test-'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('returns "none" if root is empty or package.json does not exist', () => {
    expect(detectStateLib(null)).toBe('none');
    expect(detectStateLib('')).toBe('none');
    expect(detectStateLib(tmpDir)).toBe('none');
  });

  it('returns "none" if package.json has no state library', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        name: 'test-app',
        dependencies: {
          react: '^19.0.0',
        },
      })
    );
    expect(detectStateLib(tmpDir)).toBe('none');
  });

  it('detects zustand in dependencies', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        name: 'test-app',
        dependencies: {
          zustand: '^5.0.0',
        },
      })
    );
    expect(detectStateLib(tmpDir)).toBe('zustand');
  });

  it('detects zustand in devDependencies', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        name: 'test-app',
        devDependencies: {
          zustand: '^5.0.0',
        },
      })
    );
    expect(detectStateLib(tmpDir)).toBe('zustand');
  });

  it('detects redux in dependencies', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        name: 'test-app',
        dependencies: {
          '@reduxjs/toolkit': '^2.0.0',
        },
      })
    );
    expect(detectStateLib(tmpDir)).toBe('redux');
  });

  it('detects redux in devDependencies', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        name: 'test-app',
        devDependencies: {
          '@reduxjs/toolkit': '^2.0.0',
        },
      })
    );
    expect(detectStateLib(tmpDir)).toBe('redux');
  });

  it('handles invalid JSON in package.json gracefully', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), 'not json');
    expect(detectStateLib(tmpDir)).toBe('none');
  });
});
