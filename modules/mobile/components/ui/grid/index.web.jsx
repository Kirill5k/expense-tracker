import React from 'react';
import { gridStyle, gridItemStyle } from './styles';

const Grid = React.forwardRef(
  ({ className, _extra, ...props }, ref) => {
    const gridClass = _extra?.className;
    const finalGridClass = gridClass ?? '';
    return (
      <div
        ref={ref}
        className={gridStyle({
          class: className + ' ' + finalGridClass,
        })}
        {...props}
      />
    );
  }
);

const GridItem = React.forwardRef(
  ({ className, _extra, ...props }, ref) => {
    const gridItemClass = _extra?.className;

    const finalGridItemClass = gridItemClass ?? '';
    return (
      <div
        ref={ref}
        className={gridItemStyle({
          class: className + ' ' + finalGridItemClass,
        })}
        {...props}
      />
    );
  }
);

Grid.displayName = 'Grid';
GridItem.displayName = 'GridItem';

export { Grid, GridItem };
