import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, loadTemplateDir } from '../../src/generators/template.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXAMPLE_TEMPLATE_DIR = path.resolve(__dirname, '../../templates/_core-example');

describe('template engine', () => {
  describe('render', () => {
    it('substitutes {{key}} with provided values', () => {
      const template = 'Hello {{name}}, welcome to {{Name}}! Key: {{nameCamel}}';
      const output = render(template, {
        name: 'world',
        Name: 'World',
        nameCamel: 'worldCamel',
      });
      expect(output).toBe('Hello world, welcome to World! Key: worldCamel');
    });

    it('tolerates spaces within brackets: {{ key }}', () => {
      const template = '{{ name }} / {{Name}}';
      const output = render(template, { name: 'foo', Name: 'Foo' });
      expect(output).toBe('foo / Foo');
    });

    it('leaves missing variables intact', () => {
      const template = 'Hello {{unknown}} and {{name}}';
      const output = render(template, { name: 'Lumen' });
      expect(output).toBe('Hello {{unknown}} and Lumen');
    });

    it('handles non-string template gracefully', () => {
      expect(render(null)).toBe('');
      expect(render(undefined)).toBe('');
    });
  });

  describe('loadTemplateDir', () => {
    it('loads templates and filters for ts language', () => {
      const templates = loadTemplateDir(EXAMPLE_TEMPLATE_DIR, { language: 'ts' });
      const paths = templates.map((t) => t.relPath);

      // Should strip .tpl and choose ts/tsx files
      expect(paths).toContain('__name__.ts');
      expect(paths).toContain('__Name__.tsx');
      expect(paths).not.toContain('__name__.js');
      expect(paths).not.toContain('__Name__.jsx');

      const tsFile = templates.find((t) => t.relPath === '__name__.ts');
      expect(tsFile.contents).toContain('kind: \'ts-module\'');
    });

    it('loads templates and filters for js language', () => {
      const templates = loadTemplateDir(EXAMPLE_TEMPLATE_DIR, { language: 'js' });
      const paths = templates.map((t) => t.relPath);

      // Should strip .tpl and choose js/jsx files
      expect(paths).toContain('__name__.js');
      expect(paths).toContain('__Name__.jsx');
      expect(paths).not.toContain('__name__.ts');
      expect(paths).not.toContain('__Name__.tsx');

      const jsFile = templates.find((t) => t.relPath === '__name__.js');
      expect(jsFile.contents).toContain('kind: \'js-module\'');
    });
  });
});
