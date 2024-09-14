import React from 'react';
import {ButtonIcon, ButtonText, Button} from '../ui/button';
import {MaterialIcon} from '../ui/icon';
import {Menu, MenuItem, MenuItemLabel} from '../ui/menu';
import colors from '@/constants/colors'
import {createLookup} from '@/utils/arrays'

const CategorySelect = ({items, value, onSelect, mode}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const itemsByIds = createLookup(items, c => c.id)
  const [selected, setSelected] = React.useState(value?.id ? new Set([value.id]) : new Set([]))

  return (
      <Menu
          placement="bottom start"
          offset={0}
          selectionMode="single"
          selectedKeys={selected}
          onSelectionChange={(keys) => {
            setSelected(keys)
            onSelect(itemsByIds[keys.currentKey])
          }}
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
          trigger={(triggerProps) => (
              <Button
                  size="sm"
                  variant="outline"
                  action="secondary"
                  className="justify-between align-center"
                  {...triggerProps}
              >
                {value?.icon && <ButtonIcon
                    as={MaterialIcon}
                    code={value.icon}
                    dcolor={colors[mode].text}
                    dsize={20}
                    className="flex-grow-0"
                />}
                <ButtonText className={`flex-grow ${value?.icon ? 'px-2' : 'px-1'}`}>
                  {value?.name ? value.name : 'Category'}
                </ButtonText>
                <ButtonIcon
                    className="flex-grow-0"
                    as={MaterialIcon}
                    code={isOpen ? 'chevron-up' : 'chevron-down'}
                    dcolor={value ? colors[mode].tabIconSelected : colors[mode].text}
                />
              </Button>
          )}
      >
        {items.map(c => (
            <MenuItem key={c.id} textValue={c.id}>
              <MaterialIcon
                  code={c.icon}
                  dsize={24}
                  dcolor={colors[mode].text}
              />
              <MenuItemLabel size="sm" className="px-2">{c.name}</MenuItemLabel>
            </MenuItem>
        ))}
      </Menu>
  )
}

export default CategorySelect