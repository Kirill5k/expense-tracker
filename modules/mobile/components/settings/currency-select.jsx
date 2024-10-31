import {useState} from 'react'
import {ButtonIcon, ButtonText, Button} from '../ui/button'
import {MaterialIcon} from '../ui/icon'
import {Menu, MenuItem, MenuItemLabel} from '../ui/menu'
import colors from '@/constants/colors'
import {createLookup} from '@/utils/arrays'
import {mergeClasses} from '@/utils/css'

export const currencies = [
  { country: 'United States Dollar', code: 'USD', symbol: '$' },
  { country: 'Euro', code: 'EUR', symbol: '€' },
  { country: 'Pound Sterling', code: 'GBP', symbol: '£' },
  { country: 'Japanese Yen', code: 'JPY', symbol: '¥' },
  { country: 'South Korean Won', code: 'KRW', symbol: '₩' },
  { country: 'Indian Rupee', code: 'INR', symbol: '₹' },
  { country: 'Russian Ruble', code: 'RUB', symbol: '₽' },
  { country: 'Turkish Lira', code: 'TRY', symbol: '₺' }
]

export const CurrencySelect = ({isDisabled, value, onSelect, mode, size = 'md'}) => {
  const [isOpen, setIsOpen] = useState(false)
  const currenciesByCode = createLookup(currencies, c => c.code)
  const [selected, setSelected] = useState(value?.code ? new Set([value.code]) : new Set([]))

  return (
      <Menu
          className="min-w-80"
          closeOnSelect={true}
          placement="bottom start"
          offset={0}
          selectionMode="single"
          selectedKeys={selected}
          onSelectionChange={(keys) => {
            setSelected(keys)
            onSelect(currenciesByCode[keys.currentKey])
          }}
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
          trigger={(triggerProps) => (
              <Button
                  isDisabled={isDisabled}
                  size={size}
                  variant="outline"
                  action="secondary"
                  className={mergeClasses(
                      'flex justify-between items-center px-3',
                      isOpen && 'border-primary-600'
                  )}
                  {...triggerProps}
              >
                <ButtonText className="px-0 text-lg">
                  {value?.symbol}
                </ButtonText>
                <ButtonText className="pl-2 grow text-left font-medium">
                  {currenciesByCode[value?.code]?.country}
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
        {currencies.map(c => (
            <MenuItem
                key={c.code}
                textValue={c.code}
                className={mergeClasses(value?.code === c.code && 'bg-background-100')}
            >
              <MenuItemLabel size={size} className="px-2">{c.symbol}</MenuItemLabel>
              <MenuItemLabel size={size} className="px-2">{c.country}</MenuItemLabel>
            </MenuItem>
        ))}
      </Menu>
  )
}
