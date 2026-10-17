import { useContext } from 'react';
import { {{Name}}Context, type {{Name}}ContextValue } from './{{Name}}Context';

export function use{{Name}}(): {{Name}}ContextValue {
  const context = useContext({{Name}}Context);
  if (!context) {
    throw new Error('use{{Name}} must be used within a {{Name}}Provider');
  }
  return context;
}
