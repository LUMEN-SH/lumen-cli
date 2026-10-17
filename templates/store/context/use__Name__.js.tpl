import { useContext } from 'react';
import { {{Name}}Context } from './{{Name}}Context';

export function use{{Name}}() {
  const context = useContext({{Name}}Context);
  if (!context) {
    throw new Error('use{{Name}} must be used within a {{Name}}Provider');
  }
  return context;
}
