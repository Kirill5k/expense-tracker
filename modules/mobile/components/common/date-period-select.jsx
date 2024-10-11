import React, {useState} from 'react'
import {HStack} from '../ui/hstack'
import {Menu, MenuItem, MenuItemLabel} from '../ui/menu'
import {ButtonIcon, ButtonText, Button} from '../ui/button'
import {MaterialIcon} from '../ui/icon'
import colors from '@/constants/colors'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addWeeks,
  addMonths,
  addYears
} from 'date-fns'

const dateRangeOptions = [
  {value: 'weekly', text: 'Weekly'},
  {value: 'monthly', text: 'Monthly'},
  {value: 'yearly', text: 'Yearly'}
]

const newDisplayDate = (range, start, end) => {
  switch (range) {
    case 'monthly':
      return {range, start, end, text: format(start, 'LLLL yyyy')}
    case 'yearly':
      return {range, start, end, text: format(start, 'yyyy')}
    default:
      return {range, start, end, text: `${format(start, 'do MMM')} - ${format(end, 'do MMM')}`}
  }
}

const newDisplayDateForToday = (range) => {
  const today = new Date()
  switch (range) {
    case 'weekly':
      return newDisplayDate(range, startOfWeek(today), endOfWeek(today))
    case 'monthly':
      return newDisplayDate(range, startOfMonth(today), endOfMonth(today))
    default:
      return newDisplayDate(range, startOfYear(today), endOfYear(today))
  }
}

const incrementBy = ({start, end, range}, amount) => {
  switch (range) {
    case 'monthly':
      return newDisplayDate(range, addMonths(start, amount), endOfMonth(addMonths(end, amount)))
    case 'weekly':
      return newDisplayDate(range, addWeeks(start, amount), addWeeks(end, amount))
    default:
      return newDisplayDate(range, addYears(start, amount), addYears(end, amount))
  }
}

const DatePeriodSelect = ({disabled, value, onSelect, mode, className}) => {
  const [isOpen, setIsOpen] = useState(false)

  const resetDate = (range) => {
    const newDateRange = newDisplayDateForToday(range)
    const previous = incrementBy(newDateRange, -1)
    onSelect({...newDateRange, previous})
  }

  const goBack = () => {
    const newDateRange = incrementBy(value, -1)
    const previous = incrementBy(newDateRange, -1)
    onSelect({...newDateRange, previous})
  }
  const goForward = () => {
    const previous = {...value}
    const newDateRange = incrementBy(value, 1)
    onSelect({...newDateRange, previous})
  }

  return (
      <Menu
          placement="bottom"
          offset={0}
          selectionMode="single"
          onSelectionChange={(keys) => {
            resetDate(keys.currentKey)
          }}
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
          trigger={(triggerProps) => (
              <HStack
                  space="lg"
                  className={`align-center justify-center ${className}`}
              >
                <Button
                    size="sm"
                    variant="link"
                    action="primary"
                    onPress={goBack}
                    isDisabled={disabled}
                >
                  <ButtonIcon
                      as={MaterialIcon}
                      code="chevron-left"
                      dsize={20}
                      dcolor={colors[mode].text}
                  />
                </Button>
                <Button
                    size="sm"
                    variant="link"
                    action="primary"
                    className="w-40"
                    isDisabled={disabled}
                    {...triggerProps}
                >
                  <ButtonText>
                    {value?.text}
                  </ButtonText>
                  <ButtonIcon
                      as={MaterialIcon}
                      code={isOpen ? 'chevron-up' : 'chevron-down'}
                      dcolor={colors[mode].text}
                  />
                </Button>
                <Button
                    size="sm"
                    variant="link"
                    action="primary"
                    onPress={goForward}
                    isDisabled={disabled}
                >
                  <ButtonIcon
                      as={MaterialIcon}
                      code="chevron-right"
                      dsize={20}
                      dcolor={colors[mode].text}
                  />
                </Button>
              </HStack>
          )}
      >
        {dateRangeOptions.map(o => (
            <MenuItem key={o.value} textValue={o.text} className={o.value === value?.range ? 'bg-background-100' : ''}>
              <MenuItemLabel size="sm" className="px-2">{o.text}</MenuItemLabel>
            </MenuItem>
        ))}
      </Menu>
  )
}

export default DatePeriodSelect