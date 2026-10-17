import fs from 'node:fs';
import path from 'node:path';

/**
 * Render template string replacing {{key}} with values from vars.
 * Safe regex replacement without external dependencies.
 * @param {string} templateString
 * @param {Record<string, any>} vars
 * @returns {string}
 */
export function render(templateString, vars = {}) {
  if (typeof templateString !== 'string') return '';

  return templateString.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      const val = vars[key];
      return val !== undefined && val !== null ? String(val) : '';
    }
    return match;
  });
}

/**
 * Recursively list all files in directory.
 * @param {string} dir
 * @returns {string[]} Relative paths from dir with posix forward slashes
 */
function walkDir(dir) {
  const results = [];

  function walk(current, rel) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(fullPath, entryRel);
      } else if (entry.isFile()) {
        results.push(entryRel);
      }
    }
  }

  if (fs.existsSync(dir)) {
    walk(dir, '');
  }
  return results;
}

/**
 * Filter template files by tooling language convention:
 * - If both .ts/.tsx and .js/.jsx versions of a file exist (e.g. index.ts.tpl and index.js.tpl),
 *   keep only the one matching tooling.language.
 * - Strip .tpl extension.
 *
 * @param {string} dir Absolute path to template directory
 * @param {{ language?: 'ts' | 'js' }} [options={}]
 * @returns {Array<{ relPath: string, contents: string }>}
 */
export function loadTemplateDir(dir, { language = 'ts' } = {}) {
  const relPaths = walkDir(dir);
  const isTs = language === 'ts';

  // Group files by base identity to filter between ts/js alternatives
  // e.g. "path/to/__name__.ts.tpl" vs "path/to/__name__.js.tpl"
  // e.g. "path/to/__Name__.tsx.tpl" vs "path/to/__Name__.jsx.tpl"
  const fileGroups = new Map();

  for (const rel of relPaths) {
    // Check if filename has .ts(x) or .js(x) with optional .tpl
    // Normalize .tpl
    const withoutTpl = rel.endsWith('.tpl') ? rel.slice(0, -4) : rel;

    // Detect language variant in filename
    const tsMatch = withoutTpl.match(/^(.*)\.(ts|tsx)$/);
    const jsMatch = withoutTpl.match(/^(.*)\.(js|jsx)$/);

    if (tsMatch) {
      const key = `${tsMatch[1]}.${tsMatch[2] === 'tsx' ? 'x' : 's'}`;
      if (!fileGroups.has(key)) fileGroups.set(key, {});
      fileGroups.get(key).ts = rel;
    } else if (jsMatch) {
      const key = `${jsMatch[1]}.${jsMatch[2] === 'jsx' ? 'x' : 's'}`;
      if (!fileGroups.has(key)) fileGroups.set(key, {});
      fileGroups.get(key).js = rel;
    } else {
      const key = withoutTpl;
      if (!fileGroups.has(key)) fileGroups.set(key, {});
      fileGroups.get(key).neutral = rel;
    }
  }

  const selectedRelPaths = [];
  for (const group of fileGroups.values()) {
    if (group.neutral) {
      selectedRelPaths.push(group.neutral);
    } else if (group.ts && group.js) {
      selectedRelPaths.push(isTs ? group.ts : group.js);
    } else if (group.ts) {
      // If only ts variant exists, include if isTs or as fallback
      if (isTs) selectedRelPaths.push(group.ts);
    } else if (group.js) {
      // If only js variant exists, include if !isTs or as fallback
      if (!isTs) selectedRelPaths.push(group.js);
    }
  }

  return selectedRelPaths.map((rel) => {
    const fullPath = path.join(dir, rel);
    const contents = fs.readFileSync(fullPath, 'utf8');
    // Strip .tpl suffix from the target relPath
    const targetRelPath = rel.endsWith('.tpl') ? rel.slice(0, -4) : rel;
    return {
      relPath: targetRelPath,
      contents,
    };
  });
}
