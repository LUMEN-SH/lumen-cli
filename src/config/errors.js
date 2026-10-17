import { LumenError, EXIT } from '../errors.js';

export class ConfigError extends LumenError {
  constructor(message, options = {}) {
    super(message, { code: EXIT.CONFIG, ...options });
    this.name = 'ConfigError';
    this.exitCode = EXIT.CONFIG;
  }
}

