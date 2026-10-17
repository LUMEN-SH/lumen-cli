import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { {{Name}} } from './{{Name}}';

describe('{{Name}} component', () => {
  it('renders feature component', () => {
    render(<{{Name}} />);
    expect(screen.getByTestId('{{nameKebab}}-feature')).toBeDefined();
    expect(screen.getByText('{{Name}} Feature')).toBeDefined();
  });
});
