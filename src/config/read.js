import fs from 'node:fs';
import path from 'node:path';
import {
  parseManifest,
  isV1Manifest,
  formatZodError,
  resolvePaths,
} from 'create-lumen/src/manifest/index.js';
import { ConfigError } from './errors.js';

const CONFIG_FILENAME = 'lumen.config.json';
const V1_MIGRATION_DOC = 'docs/migration/v1-to-v2.md';

/**
 * Walk up directory tree to locate lumen.config.json.
 * @param {string} [startDir=process.cwd()]
 * @returns {string | null} Absolute path to lumen.config.json or null if not found
 */
export function findConfigFile(startDir = process.cwd()) {
  let currentDir = path.resolve(startDir);

  while (true) {
    const candidate = path.join(currentDir, CONFIG_FILENAME);
    if (fs.existsSync(candidate)) {
      try {
        const stat = fs.statSync(candidate);
        if (stat.isFile()) {
          return candidate;
        }
      } catch {
        // Continue searching if unreadable
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  return null;
}

/**
 * Normalise manifest v2.1 fields:
 * - architecture.preset ?? architecture.type
 * - validation defaults to 'strict'
 * - harness.commands default []
 * - agentDocs boolean
 * @param {object} manifest
 * @returns {object} Normalised manifest
 */
export function normalizeManifest(manifest) {
  const normalized = { ...manifest };

  const arch = { ...(normalized.architecture || {}) };
  const preset = arch.preset ?? arch.type;
  const type = arch.type ?? arch.preset;
  arch.preset = preset;
  arch.type = type;
  arch.validation = arch.validation ?? 'strict';
  normalized.architecture = arch;

  if (normalized.harness) {
    normalized.harness = {
      ...normalized.harness,
      commands: normalized.harness.commands ?? [],
    };
  } else {
    normalized.harness = { commands: [] };
  }

  normalized.agentDocs = Boolean(normalized.agentDocs);

  return normalized;
}

/**
 * Reads and validates lumen.config.json from cwd or closest ancestor.
 * @param {{ cwd?: string }} [options={}]
 * @returns {{ manifest: object, paths: object, root: string, file: string }}
 */
export function readConfig({ cwd = process.cwd() } = {}) {
  const configFile = findConfigFile(cwd);
  if (!configFile) {
    throw new ConfigError(
      `Could not find ${CONFIG_FILENAME} in ${cwd} or any parent directory.`
    );
  }

  let rawContent;
  try {
    rawContent = fs.readFileSync(configFile, 'utf8');
  } catch (err) {
    throw new ConfigError(
      `Failed to read config file at ${configFile}: ${err.message}`,
      { cause: err }
    );
  }

  let raw;
  try {
    raw = JSON.parse(rawContent);
  } catch (err) {
    throw new ConfigError(
      `Failed to parse ${CONFIG_FILENAME} as JSON at ${configFile}: ${err.message}`,
      { cause: err }
    );
  }

  if (isV1Manifest(raw) || raw?.manifestVersion === undefined) {
    throw new ConfigError(
      `Manifest v1 detected (or missing manifestVersion). create-lumen v2 uses a nested manifest (manifestVersion: 2).\n` +
        `Please migrate following the guide in create-lumen: ${V1_MIGRATION_DOC}`
    );
  }

  let parsed;
  try {
    parsed = parseManifest(raw);
  } catch (err) {
    const formatted = formatZodError(err?.cause || err) || err.message;
    throw new ConfigError(formatted, { cause: err });
  }

  const normalized = normalizeManifest(parsed);
  const resolved = resolvePaths({
    architecture: normalized.architecture.preset,
    framework: normalized.framework,
  });

  const finalPaths = {
    ...resolved,
    ...(normalized.paths || {}),
  };

  const root = path.dirname(configFile);

  return {
    manifest: normalized,
    paths: finalPaths,
    root,
    file: configFile,
  };
}
