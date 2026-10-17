import fs from 'node:fs';
import path from 'node:path';

/**
 * Common locations to inspect for existing API / HTTP client modules.
 */
const AXIOS_CANDIDATES = [
  'src/shared/lib/axios.ts',
  'src/shared/lib/axios.js',
  'src/shared/api/client.ts',
  'src/shared/api/client.js',
  'src/lib/axios.ts',
  'src/lib/axios.js',
  'src/lib/api.ts',
  'src/lib/api.js',
  'src/api/client.ts',
  'src/api/client.js',
];

const FETCH_CANDIDATES = [
  'src/shared/lib/api.ts',
  'src/shared/lib/api.js',
  'src/shared/api/client.ts',
  'src/shared/api/client.js',
  'src/lib/api.ts',
  'src/lib/api.js',
  'src/api/client.ts',
  'src/api/client.js',
];

/**
 * Normalizes relative posix import path from service file to client module.
 *
 * @param {string} serviceDir Relative service directory from root (e.g. 'src/shared/services' or 'src/services')
 * @param {string} clientFilePath Relative candidate path from root (e.g. 'src/shared/lib/axios.ts')
 * @returns {string} Relative import specifier without ts/js extension
 */
export function calculateRelativeImport(serviceDir, clientFilePath) {
  // Strip extension
  const withoutExt = clientFilePath.replace(/\.(ts|js|tsx|jsx)$/, '');
  let rel = path.posix.relative(serviceDir, withoutExt);
  if (!rel.startsWith('.')) {
    rel = `./${rel}`;
  }
  return rel;
}

/**
 * Detects whether project uses axios or fetch based on dependencies in package.json at root.
 * Also checks common module locations to provide a clean relative import or a TODO import.
 *
 * @param {string} root Project root absolute path
 * @param {string} [serviceTargetDir] Service destination directory relative to project root
 * @returns {{ client: 'axios' | 'fetch', importStatement: string, importPath: string, hasCustomClient: boolean }}
 */
export function detectHttpClient(root, serviceTargetDir) {
  let pkg = {};
  const pkgPath = path.join(root, 'package.json');

  if (fs.existsSync(pkgPath)) {
    try {
      const raw = fs.readFileSync(pkgPath, 'utf8');
      pkg = JSON.parse(raw);
    } catch {
      // Fallback if unreadable or invalid JSON
    }
  }

  const allDeps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  const isAxios = Boolean(allDeps.axios);

  if (isAxios) {
    // Search for axios instance module
    let foundPath = null;
    for (const candidate of AXIOS_CANDIDATES) {
      if (fs.existsSync(path.join(root, candidate))) {
        foundPath = candidate;
        break;
      }
    }

    if (foundPath && serviceTargetDir) {
      const importPath = calculateRelativeImport(serviceTargetDir, foundPath);
      return {
        client: 'axios',
        importPath,
        importStatement: `import api from '${importPath}';`,
        hasCustomClient: true,
      };
    }

    if (foundPath) {
      return {
        client: 'axios',
        importPath: foundPath,
        importStatement: `import api from '${foundPath.replace(/\.(ts|js)$/, '')}';`,
        hasCustomClient: true,
      };
    }

    // Axios is installed but no common instance found
    return {
      client: 'axios',
      importPath: 'axios',
      importStatement: `// TODO: Import your configured axios instance (e.g. from '@/shared/lib/axios' or '@/lib/api')\nimport axios from 'axios';`,
      hasCustomClient: false,
    };
  }

  // Fetch detection
  let foundFetchPath = null;
  for (const candidate of FETCH_CANDIDATES) {
    if (fs.existsSync(path.join(root, candidate))) {
      foundFetchPath = candidate;
      break;
    }
  }

  if (foundFetchPath && serviceTargetDir) {
    const importPath = calculateRelativeImport(serviceTargetDir, foundFetchPath);
    return {
      client: 'fetch',
      importPath,
      importStatement: `import { apiClient } from '${importPath}';`,
      hasCustomClient: true,
    };
  }

  if (foundFetchPath) {
    return {
      client: 'fetch',
      importPath: foundFetchPath,
      importStatement: `import { apiClient } from '${foundFetchPath.replace(/\.(ts|js)$/, '')}';`,
      hasCustomClient: true,
    };
  }

  return {
    client: 'fetch',
    importPath: '',
    importStatement: `// TODO: Adapt with your project's fetch wrapper or apiClient if available\nconst BASE_URL = '/api';`,
    hasCustomClient: false,
  };
}
