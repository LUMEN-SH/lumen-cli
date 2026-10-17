import { registerGenerate } from './generate.js';
import { registerConfig } from './config.js';
import { registerCreate } from './create.js';

export function registerCommands(program) {
  registerGenerate(program);
  registerConfig(program);
  registerCreate(program);
  return program;
}
