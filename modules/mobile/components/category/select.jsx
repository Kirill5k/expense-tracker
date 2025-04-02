import {ButtonIcon, ButtonText, Button} from '../ui/button'
import {MaterialIcon} from '../ui/icon'
import {Menu, MenuItem, MenuItemLabel} from '../ui/menu'
import Colors from '@/constants/colors'
import {createLookup} from '@/utils/arrays'
import {mergeClasses} from '@/utils/css'


const CategorySelect = ({items, value, onSelect, mode, isInvalid, flat = false}) => {
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
                  variant="outline"
                  action="primary"
                  className={mergeClasses(
                      'justify-between items-center pl-4',
                      isOpen && 'border-primary-600',
                      flat && 'border-0 bg-background-50',
                      flat && isOpen && 'bg-background-100'
                  )}
                  style={{
                    borderColor: isInvalid ? Colors[mode].borderInvalid : Colors[mode].border
                  }}
                  {...triggerProps}
              >
                {value?.icon && <ButtonIcon
                    as={MaterialIcon}
                    code={value.icon}
                    dcolor={Colors[mode].text}
                    dsize={20}
                    className="flex-grow-0"
                />}
                <ButtonText className={mergeClasses('flex-grow pl-1', value?.icon && 'px-2')}>
                  {value?.name ? value.name : 'Select category'}
                </ButtonText>
                <ButtonIcon
                    className="flex-grow-0"
                    as={MaterialIcon}
                    code={isOpen ? 'chevron-up' : 'chevron-down'}
                    dcolor={value ? Colors[mode].tabIconSelected : Colors[mode].text}
                />
              </Button>
          )}
      >
        {items.map(c => (
            <MenuItem key={c.id} textValue={c.id} className={mergeClasses(c.id === value?.id && 'bg-background-100')}>
              <MaterialIcon
                  code={c.icon}
                  dsize={24}
                  dcolor={Colors[mode].text}
              />
              <MenuItemLabel className="px-2">{c.name}</MenuItemLabel>
            </MenuItem>
        ))}
      </Menu>
  )
}

export default CategorySelect