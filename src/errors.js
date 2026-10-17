export const EXIT = {
  OK: 0,
  USER: 1,
  CONFIG: 2,
  INTERNAL: 70,
};

export class LumenError extends Error {
  constructor(message, { code = EXIT.USER, hint } = {}) {
    super(message);
    this.name = 'LumenError';
    this.code = code;
    this.hint = hint;
  }
}
