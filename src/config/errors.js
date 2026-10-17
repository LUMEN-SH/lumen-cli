export class ConfigError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'ConfigError';
    this.code = 'CONFIG';
    this.exitCode = 2;
  }
}
