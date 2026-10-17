import { describe, it, expect } from 'vitest';
import { LumenError, EXIT } from '../src/errors.js';

describe('LumenError and EXIT codes', () => {
  it('defines the standard exit codes', () => {
    expect(EXIT).toEqual({
      OK: 0,
      USER: 1,
      CONFIG: 2,
      INTERNAL: 70,
    });
  });

  it('creates LumenError with default exit code USER', () => {
    const error = new LumenError('Bad input');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('LumenError');
    expect(error.message).toBe('Bad input');
    expect(error.code).toBe(EXIT.USER);
    expect(error.hint).toBeUndefined();
  });

  it('creates LumenError with custom code and hint', () => {
    const error = new LumenError('Invalid config', {
      code: EXIT.CONFIG,
      hint: 'Run lumen init to create a valid manifest',
    });
    expect(error.name).toBe('LumenError');
    expect(error.message).toBe('Invalid config');
    expect(error.code).toBe(EXIT.CONFIG);
    expect(error.hint).toBe('Run lumen init to create a valid manifest');
  });
});
