import React from 'react';
import { View, ViewProps } from 'react-native';

import { boxStyle } from './styles';

const Box = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <View ref={ref} {...props} className={boxStyle({ class: className })} />
    );
  }
);

Box.displayName = 'Box';
export { Box };
