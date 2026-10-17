import { registerGenerate } from './generate.js';

export function registerCommands(program) {
  registerGenerate(program);
  return program;
}
