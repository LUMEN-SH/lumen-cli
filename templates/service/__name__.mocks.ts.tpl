import { {{Name}} } from './{{name}}.service';

export const mock{{Name}}: {{Name}} = {
  id: 'mock-1',
};

export const mock{{Name}}List: {{Name}}[] = [
  mock{{Name}},
  {
    id: 'mock-2',
  },
];
