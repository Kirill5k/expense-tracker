'use client';
import React from 'react';
import { Overlay } from '@gluestack-ui/overlay';
import { cssInterop } from 'nativewind';

cssInterop(Overlay, { className: 'style' });

export const Portal = React.forwardRef(({ ...props }, ref) => {
  return <Overlay {...props} ref={ref} />;
});
