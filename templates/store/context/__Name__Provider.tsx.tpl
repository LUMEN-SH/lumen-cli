import { useState, type ReactNode } from 'react';
import { {{Name}}Context } from './{{Name}}Context';

export interface {{Name}}ProviderProps {
  children: ReactNode;
}

export function {{Name}}Provider({ children }: {{Name}}ProviderProps) {
  const [count, setCount] = useState(0);

  const increment = () => setCount((prev) => prev + 1);
  const decrement = () => setCount((prev) => prev - 1);
  const reset = () => setCount(0);

  return (
    <{{Name}}Context.Provider value={{ count, increment, decrement, reset }}>
      {children}
    </{{Name}}Context.Provider>
  );
}
