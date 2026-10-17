import { createContext } from 'react';

export interface {{Name}}ContextValue {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const {{Name}}Context = createContext<{{Name}}ContextValue | null>(null);
