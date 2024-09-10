import React from 'react';
import { View, ViewProps } from 'react-native';
import { cardStyle } from './styles';

const Card = React.forwardRef(
  ({ className, size = 'md', variant = 'elevated', ...props }, ref) => {
    return (
      <View
        className={cardStyle({ size, variant, class: className })}
        {...props}
        ref={ref}
      />
    );
  }
);

Card.displayName = 'Card';

export { Card };
