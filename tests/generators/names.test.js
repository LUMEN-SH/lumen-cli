import { describe, it, expect } from 'vitest';
import {
  toKebab,
  toPascal,
  toCamel,
  toSnake,
  toConstant,
  validateName,
  buildNameVariants,
} from '../../src/generators/names.js';
import { LumenError, EXIT } from '../../src/errors.js';

describe('names utility', () => {
  describe('casing conversions', () => {
    it('converts to kebab-case', () => {
      expect(toKebab('userProfile')).toBe('user-profile');
      expect(toKebab('UserProfile')).toBe('user-profile');
      expect(toKebab('user_profile')).toBe('user-profile');
      expect(toKebab('USER_PROFILE')).toBe('user-profile');
      expect(toKebab('')).toBe('');
    });

    it('converts to PascalCase', () => {
      expect(toPascal('user-profile')).toBe('UserProfile');
      expect(toPascal('user_profile')).toBe('UserProfile');
      expect(toPascal('userProfile')).toBe('UserProfile');
      expect(toPascal('user profile')).toBe('UserProfile');
      expect(toPascal('')).toBe('');
    });

    it('converts to camelCase', () => {
      expect(toCamel('user-profile')).toBe('userProfile');
      expect(toCamel('UserProfile')).toBe('userProfile');
      expect(toCamel('user_profile')).toBe('userProfile');
      expect(toCamel('')).toBe('');
    });

    it('converts to snake_case', () => {
      expect(toSnake('userProfile')).toBe('user_profile');
      expect(toSnake('UserProfile')).toBe('user_profile');
      expect(toSnake('user-profile')).toBe('user_profile');
      expect(toSnake('')).toBe('');
    });

    it('converts to CONSTANT_CASE', () => {
      expect(toConstant('userProfile')).toBe('USER_PROFILE');
      expect(toConstant('user-profile')).toBe('USER_PROFILE');
      expect(toConstant('user_profile')).toBe('USER_PROFILE');
      expect(toConstant('')).toBe('');
    });
  });

  describe('validateName', () => {
    it('accepts valid identifier names', () => {
      expect(validateName('user-profile')).toBe('user-profile');
      expect(validateName('Auth')).toBe('Auth');
      expect(validateName('header_nav')).toBe('header_nav');
      expect(validateName('item123')).toBe('item123');
    });

    it('rejects empty or whitespace-only names', () => {
      expect(() => validateName('')).toThrow(LumenError);
      expect(() => validateName('   ')).toThrow(LumenError);
      expect(() => validateName(null)).toThrow(LumenError);
      expect(() => validateName(undefined)).toThrow(LumenError);

      try {
        validateName('');
      } catch (err) {
        expect(err.code).toBe(EXIT.USER);
        expect(err.message).toContain('Name is required');
      }
    });

    it('rejects path traversal attempts', () => {
      expect(() => validateName('../evil')).toThrow(LumenError);
      expect(() => validateName('sub/path')).toThrow(LumenError);
      expect(() => validateName('sub\\path')).toThrow(LumenError);
      expect(() => validateName('..')).toThrow(LumenError);

      try {
        validateName('../evil');
      } catch (err) {
        expect(err.code).toBe(EXIT.USER);
        expect(err.message).toContain('path traversal');
      }
    });

    it('rejects unsupported characters', () => {
      expect(() => validateName('user@profile')).toThrow(LumenError);
      expect(() => validateName('user$name')).toThrow(LumenError);
      expect(() => validateName('foo.bar')).toThrow(LumenError);
      expect(() => validateName('foo bar')).toThrow(LumenError);
    });
  });

  describe('buildNameVariants', () => {
    it('returns dictionary of variants for templates', () => {
      const variants = buildNameVariants('user-profile');
      expect(variants).toEqual({
        name: 'user-profile',
        Name: 'UserProfile',
        nameCamel: 'userProfile',
        namePascal: 'UserProfile',
        nameKebab: 'user-profile',
        nameSnake: 'user_profile',
        nameConstant: 'USER_PROFILE',
      });
    });
  });
});
