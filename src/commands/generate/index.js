import { registerFeature } from './feature.js';
import { registerPage } from './page.js';
import { registerService } from './service.js';
import { registerStore } from './store.js';
import { registerForm } from './form.js';

/** Attach every `lumen generate <kind>` subcommand to the generate command. */
export function registerGenerators(generate) {
  registerFeature(generate);
  registerPage(generate);
  registerService(generate);
  registerStore(generate);
  registerForm(generate);
}
