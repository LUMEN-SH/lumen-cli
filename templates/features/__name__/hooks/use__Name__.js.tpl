import { useState, useCallback } from 'react';

export function use{{Name}}() {
  const [isActive, setIsActive] = useState(false);

  const toggle = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  return {
    isActive,
    toggle,
  };
}
