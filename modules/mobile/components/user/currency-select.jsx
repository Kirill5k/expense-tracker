import React from 'react';
import {ButtonIcon, ButtonText, Button} from '../ui/button';
import {MaterialIcon} from '../ui/icon';
import {Menu, MenuItem, MenuItemLabel} from '../ui/menu';
import colors from '@/constants/colors'
import {createLookup} from '@/utils/arrays'

const currencies = [
  { country: 'United States Dollar', code: 'USD', symbol: '$' },
  { country: 'Euro', code: 'EUR', symbol: '€' },
  { country: 'Pound Sterling', code: 'GBP', symbol: '£' },
  { country: 'Japanese Yen', code: 'JPY', symbol: '¥' },
  { country: 'South Korean Won', code: 'KRW', symbol: '₩' },
  { country: 'Indian Rupee', code: 'INR', symbol: '₹' },
  { country: 'Russian Ruble', code: 'RUB', symbol: '₽' },
  { country: 'Turkish Lira', code: 'TRY', symbol: '₺' }
]

const CurrencySelect = ({value, onSelect, mode}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const currenciesByCode = createLookup(currencies, c => c.code)
  const [selected, setSelected] = React.useState(value?.code ? new Set([value.code]) : new Set([]))

  return (
      <Menu
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
                  size="sm"
                  variant="link"
                  action="secondary"
                  className="justify-between align-center border-b"
                  {...triggerProps}
              >
                <ButtonText className="px-2 text-lg">
                  {value.symbol}
                </ButtonText>
                <ButtonText className="pl-2 grow text-sm text-left">
                  {currenciesByCode[value.code].country}
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
                className={`${value.code === c.code ? 'bg-background-100' : ''}`}
            >
              <MenuItemLabel size="md" className="px-2">{c.symbol}</MenuItemLabel>
              <MenuItemLabel size="sm" className="px-2">{c.country}</MenuItemLabel>
            </MenuItem>
        ))}
      </Menu>
  )
}

export default CurrencySelect