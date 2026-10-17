import { registerGenerate } from './generate.js';
import { registerCreate } from './create.js';

export function registerCommands(program) {
  registerGenerate(program);
  registerCreate(program);
  return program;
}
