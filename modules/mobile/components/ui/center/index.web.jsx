import React from 'react';
import { centerStyle } from './styles';

const Center = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <div className={centerStyle({ class: className })} {...props} ref={ref} />
    );
  }
);

Center.displayName = 'Center';

export { Center };
