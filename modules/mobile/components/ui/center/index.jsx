import { View, ViewProps } from 'react-native';
import React from 'react';
import { centerStyle } from './styles';

const Center = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <View
        className={centerStyle({ class: className })}
        {...props}
        ref={ref}
      />
    );
  }
);

Center.displayName = 'Center';

export { Center };
