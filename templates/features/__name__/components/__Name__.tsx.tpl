import type { FC } from 'react';
import type { {{Name}}Props } from '../types/index';

export const {{Name}}: FC<{{Name}}Props> = ({ className = '' }) => {
  return (
    <div className={`p-4 ${className}`.trim()} data-testid="{{nameKebab}}-feature">
      <h2 className="text-xl font-bold">{{Name}} Feature</h2>
    </div>
  );
};
