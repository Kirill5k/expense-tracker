import React, {useState, forwardRef, useImperativeHandle} from 'react'
import {ButtonIcon, ButtonText, Button} from '../ui/button'
import {MaterialIcon} from '../ui/icon'
import {Menu, MenuItem, MenuItemLabel} from '../ui/menu'
import colors from '@/constants/colors'
import {createLookup} from '@/utils/arrays'
import {mergeClasses} from '@/utils/css'

export const currencies = [
  { country: 'United States Dollar', code: 'USD', symbol: '$', locales: ['en-US'] },
  { country: 'Argentine Peso', code: 'ARS', symbol: '$', locales: ['es-AR'] },
  { country: 'Australian Dollar', code: 'AUD', symbol: 'A$', locales: ['en-AU'] },
  { country: 'Brazilian Real', code: 'BRL', symbol: 'R$', locales: ['pt-BR'] },
  { country: 'British Pound Sterling', code: 'GBP', symbol: '£', locales: ['en-GB'] },
  { country: 'Canadian Dollar', code: 'CAD', symbol: 'C$', locales: ['en-CA', 'fr-CA'] },
  { country: 'Chilean Peso', code: 'CLP', symbol: '$', locales: ['es-CL'] },
  { country: 'Chinese Yuan', code: 'CNY', symbol: '¥', locales: ['zh-CN'] },
  { country: 'Czech Koruna', code: 'CZK', symbol: 'Kč', locales: ['cs-CZ'] },
  { country: 'Danish Krone', code: 'DKK', symbol: 'kr', locales: ['da-DK'] },
  { country: 'Euro', code: 'EUR', symbol: '€', locales: ['de-DE', 'fr-FR', 'es-ES', 'it-IT', 'nl-NL', 'fi-FI', 'pt-PT', 'el-GR', 'sk-SK', 'et-EE'] },
  { country: 'Hong Kong Dollar', code: 'HKD', symbol: 'HK$', locales: ['zh-HK', 'en-HK'] },
  { country: 'Indian Rupee', code: 'INR', symbol: '₹', locales: ['hi-IN', 'en-IN'] },
  { country: 'Japanese Yen', code: 'JPY', symbol: '¥', locales: ['ja-JP'] },
  { country: 'Malaysian Ringgit', code: 'MYR', symbol: 'RM', locales: ['ms-MY'] },
  { country: 'Mexican Peso', code: 'MXN', symbol: '$', locales: ['es-MX'] },
  { country: 'Namibian Dollar', code: 'NAD', symbol: 'N$', locales: ['en-NA'] },
  { country: 'New Zealand Dollar', code: 'NZD', symbol: 'NZ$', locales: ['en-NZ'] },
  { country: 'Norwegian Krone', code: 'NOK', symbol: 'kr', locales: ['nb-NO', 'nn-NO'] },
  { country: 'Russian Ruble', code: 'RUB', symbol: '₽', locales: ['ru-RU'] },
  { country: 'South African Rand', code: 'ZAR', symbol: 'R', locales: ['en-ZA', 'af-ZA', 'zu-ZA'] },
  { country: 'South Korean Won', code: 'KRW', symbol: '₩', locales: ['ko-KR'] },
  { country: 'Swedish Krona', code: 'SEK', symbol: 'kr', locales: ['sv-SE'] },
  { country: 'Swiss Franc', code: 'CHF', symbol: 'Fr', locales: ['de-CH', 'fr-CH', 'it-CH'] },
  { country: 'Turkish Lira', code: 'TRY', symbol: '₺', locales: ['tr-TR'] }
]

const currenciesByCode = createLookup(currencies, c => c.code)

export const getCurrencyByCode = (code, defaultCode = 'USD') => currenciesByCode[code] || currenciesByCode[defaultCode]

export const CurrencySelect = forwardRef((
    {className, isDisabled, value, onSelect, mode, size = 'md', flat = false},
    ref
) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(value?.code ? new Set([value.code]) : new Set([]))

  useImperativeHandle(ref, () => ({
    focus: () => {
      setIsOpen(true)
    }
  }))

  return (
      <Menu
          isOpen={isOpen}
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
                      isOpen && 'border-primary-600',
                      flat && 'border-0 bg-background-50',
                      isOpen && flat && 'bg-background-100',
                      className
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
              <MenuItemLabel size={size} className="pl-2 w-12">{c.symbol}</MenuItemLabel>
              <MenuItemLabel size={size} className="px-2">{c.country}</MenuItemLabel>
            </MenuItem>
        ))}
      </Menu>
  )
})
