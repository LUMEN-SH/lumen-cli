import { LumenError, EXIT } from '../errors.js';

/**
 * Convert string to kebab-case (e.g. userProfile -> user-profile).
 * @param {string} str
 * @returns {string}
 */
export function toKebab(str) {
  if (!str) return '';
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

/**
 * Convert string to PascalCase (e.g. user-profile -> UserProfile).
 * @param {string} str
 * @returns {string}
 */
export function toPascal(str) {
  if (!str) return '';
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^[a-z]/, (c) => c.toUpperCase());
}

/**
 * Convert string to camelCase (e.g. user-profile -> userProfile).
 * @param {string} str
 * @returns {string}
 */
export function toCamel(str) {
  if (!str) return '';
  const pascal = toPascal(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert string to snake_case (e.g. user-profile -> user_profile).
 * @param {string} str
 * @returns {string}
 */
export function toSnake(str) {
  if (!str) return '';
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

/**
 * Convert string to CONSTANT_CASE (e.g. user-profile -> USER_PROFILE).
 * @param {string} str
 * @returns {string}
 */
export function toConstant(str) {
  if (!str) return '';
  return toSnake(str).toUpperCase();
}

/**
 * Validate generator input name.
 * Rejects empty, whitespace-only, path traversal ('..', '/', '\\'), and invalid characters.
 * @param {unknown} name
 * @returns {string} Validated name
 * @throws {LumenError}
 */
export function validateName(name) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new LumenError('Name is required and cannot be empty.', {
      code: EXIT.USER,
      hint: 'Provide a valid identifier name, e.g. "user-profile" or "auth".',
    });
  }

  const trimmed = name.trim();

  // Reject path traversal patterns
  if (
    trimmed.includes('..') ||
    trimmed.includes('/') ||
    trimmed.includes('\\')
  ) {
    throw new LumenError(`Invalid name "${trimmed}": path traversal characters are not allowed.`, {
      code: EXIT.USER,
      hint: 'Names must be single identifier tokens without slashes or path segments.',
    });
  }

  // Reject invalid characters (allow alphanumeric, hyphens, underscores)
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    throw new LumenError(`Invalid name "${trimmed}": contains unsupported characters.`, {
      code: EXIT.USER,
      hint: 'Names must contain only alphanumeric characters, hyphens, and underscores.',
    });
  }

  return trimmed;
}

/**
 * Generate standard naming variants for template interpolation.
 * @param {string} name
 * @returns {{ name: string, Name: string, nameCamel: string, namePascal: string, nameKebab: string, nameSnake: string, nameConstant: string }}
 */
export function buildNameVariants(name) {
  const validated = validateName(name);
  const kebab = toKebab(validated);
  const pascal = toPascal(validated);
  const camel = toCamel(validated);
  const snake = toSnake(validated);
  const constant = toConstant(validated);

  return {
    name: validated,
    Name: pascal,
    nameCamel: camel,
    namePascal: pascal,
    nameKebab: kebab,
    nameSnake: snake,
    nameConstant: constant,
  };
}
