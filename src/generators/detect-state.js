import fs from 'node:fs';
import path from 'node:path';

/**
 * Detect the project's state management library from package.json dependencies.
 *
 * @param {string} root Project root directory
 * @returns {'zustand' | 'redux' | 'none'}
 */
export function detectStateLib(root) {
  if (!root) return 'none';

  const pkgPath = path.join(root, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return 'none';
  }

  try {
    const raw = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(raw);
    const deps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };

    if ('zustand' in deps) {
      return 'zustand';
    }

    if ('@reduxjs/toolkit' in deps) {
      return 'redux';
    }

    return 'none';
  } catch {
    return 'none';
  }
}
