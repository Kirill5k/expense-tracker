import React from 'react';
import { cardStyle } from './styles';

const Card = React.forwardRef(
  ({ className, size = 'md', variant = 'elevated', ...props }, ref) => {
    return (
      <div
        className={cardStyle({ size, variant, class: className })}
        {...props}
        ref={ref}
      />
    );
  }
);

Card.displayName = 'Card';

export { Card };
