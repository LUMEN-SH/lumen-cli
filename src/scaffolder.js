import { createRequire } from 'node:module';
import { spawn as nodeSpawn } from 'node:child_process';
import path from 'node:path';
import { LumenError, EXIT } from './errors.js';

/**
 * Resolves the absolute path to create-lumen's CLI binary.
 *
 * @param {string} [fromUrl=import.meta.url]
 * @returns {string} Absolute path to bin/cli.js
 */
export function resolveScaffolderBin(fromUrl = import.meta.url) {
  let pkgPath;
  try {
    const req = createRequire(fromUrl);
    pkgPath = req.resolve('create-lumen/package.json');
  } catch (err) {
    throw new LumenError('create-lumen is not installed', {
      code: EXIT.USER,
      hint: 'npm i create-lumen@^2',
      cause: err,
    });
  }

  try {
    const req = createRequire(fromUrl);
    const pkg = req(pkgPath);
    const binRel = typeof pkg.bin === 'string'
      ? pkg.bin
      : (pkg.bin && (pkg.bin['create-lumen'] || Object.values(pkg.bin)[0]));

    if (!binRel) {
      throw new LumenError('create-lumen binary configuration not found in package.json', {
        code: EXIT.USER,
        hint: 'npm i create-lumen@^2',
      });
    }

    return path.resolve(path.dirname(pkgPath), binRel);
  } catch (err) {
    if (err instanceof LumenError) {
      throw err;
    }
    throw new LumenError('create-lumen is not installed', {
      code: EXIT.USER,
      hint: 'npm i create-lumen@^2',
      cause: err,
    });
  }
}

/**
 * Spawns create-lumen with stdio 'inherit', forwards signals, and returns exit code.
 *
 * @param {string[]} [args=[]]
 * @param {object} [options={}]
 * @param {string} [options.cwd=process.cwd()]
 * @param {Function} [options.spawn=nodeSpawn]
 * @param {string} [options.fromUrl=import.meta.url]
 * @returns {Promise<number>}
 */
export function runScaffolder(args = [], { cwd = process.cwd(), spawn = nodeSpawn, fromUrl = import.meta.url } = {}) {
  const binPath = resolveScaffolderBin(fromUrl);

  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(process.execPath, [binPath, ...args], {
        stdio: 'inherit',
        cwd,
      });
    } catch (err) {
      return reject(err);
    }

    const onSigInt = () => {
      if (child && !child.killed) {
        child.kill('SIGINT');
      }
    };

    const onSigTerm = () => {
      if (child && !child.killed) {
        child.kill('SIGTERM');
      }
    };

    process.on('SIGINT', onSigInt);
    process.on('SIGTERM', onSigTerm);

    const cleanup = () => {
      process.removeListener('SIGINT', onSigInt);
      process.removeListener('SIGTERM', onSigTerm);
    };

    child.on('error', (err) => {
      cleanup();
      reject(err);
    });

    child.on('close', (code, signal) => {
      cleanup();
      if (signal === 'SIGINT') {
        resolve(130);
      } else if (signal === 'SIGTERM') {
        resolve(143);
      } else if (typeof code === 'number') {
        resolve(code);
      } else {
        resolve(1);
      }
    });
  });
}
