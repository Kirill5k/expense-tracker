'use client';
import React from 'react';
import { Switch as RNSwitch, Platform } from 'react-native';
import { createSwitch } from '@gluestack-ui/switch';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { withStyleContext } from '@gluestack-ui/nativewind-utils/withStyleContext';
import { withStyleContextAndStates } from '@gluestack-ui/nativewind-utils/withStyleContextAndStates';
import { cssInterop } from 'nativewind';

const SwitchWrapper = React.forwardRef(({ ...props }, ref) => {
  return <RNSwitch {...props} ref={ref} />;
});

const UISwitch = createSwitch({
  Root:
    Platform.OS === 'web'
      ? withStyleContext(SwitchWrapper)
      : withStyleContextAndStates(SwitchWrapper),
});

cssInterop(SwitchWrapper, { className: 'style' });

const switchStyle = tva({
  base: 'data-[focus=true]:outline-0 data-[focus=true]:ring-2 data-[focus=true]:ring-indicator-primary web:cursor-pointer disabled:cursor-not-allowed data-[disabled=true]:opacity-40 data-[invalid=true]:border-error-700 data-[invalid=true]:rounded-xl data-[invalid=true]:border-2',

  variants: {
    size: {
      sm: 'scale-75',
      md: '',
      lg: 'scale-125',
    },
  },
});


const Switch = React.forwardRef(({ className, size = 'md', ...props }, ref) => {
  return (
    <UISwitch
      ref={ref}
      {...props}
      className={switchStyle({ size, class: className })}
    />
  );
});

Switch.displayName = 'Switch';
export { Switch };
