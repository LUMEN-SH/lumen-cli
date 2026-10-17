import { registerGenerate } from './generate.js';
import { registerConfig } from './config.js';

export function registerCommands(program) {
  registerGenerate(program);
  registerConfig(program);
  return program;
}
