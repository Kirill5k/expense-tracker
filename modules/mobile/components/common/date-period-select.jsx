import {useState} from 'react'
import {HStack} from '@/components/ui/hstack'
import {Menu, MenuItem, MenuItemLabel} from '@/components/ui/menu'
import {ButtonIcon, ButtonText, Button} from '@/components/ui/button'
import {MaterialIcon} from '@/components/ui/icon'
import colors from '@/constants/colors'
import {mergeClasses} from '@/utils/css'
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

const newDisplayDate = (range, start, end) => {
  switch (range) {
    case 'monthly':
      return {range, start, end, text: format(start, 'LLLL yyyy')}
    case 'yearly':
      return {range, start, end, text: format(start, 'yyyy')}
    default:
      return {range, start, end, text: `${format(start, 'dd MMM')} - ${format(end, 'dd MMM')}`}
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

const ranges = {
  weekly: {label: 'Week', value: 'weekly'},
  monthly: {label: 'Month', value: 'monthly'},
  yearly: {label: 'Year', value: 'yearly'}
}

export const MenuDatePeriodSelect = ({disabled, value, onSelect, mode, className}) => {
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
                  className={`items-center justify-between ${className}`}
              >
                <Button
                    size="mg"
                    variant="link"
                    action="primary"
                    onPress={goBack}
                    isDisabled={disabled}
                >
                  <ButtonIcon
                      as={MaterialIcon}
                      code="chevron-left"
                      dsize={36}
                      dcolor={colors[mode].text}
                  />
                </Button>
                <Button
                    size="lg"
                    variant="link"
                    action="primary"
                    className="w-40"
                    isDisabled={disabled}
                    {...triggerProps}
                >
                  <ButtonText className="text-xl">
                    {value?.text}
                  </ButtonText>
                  <ButtonIcon
                      as={MaterialIcon}
                      code={isOpen ? 'chevron-up' : 'chevron-down'}
                      dcolor={colors[mode].text}
                      dsize={24}
                  />
                </Button>
                <Button
                    size="md"
                    variant="link"
                    action="primary"
                    onPress={goForward}
                    isDisabled={disabled}
                >
                  <ButtonIcon
                      as={MaterialIcon}
                      code="chevron-right"
                      dsize={36}
                      dcolor={colors[mode].text}
                  />
                </Button>
              </HStack>
          )}
      >
        {Object.values(ranges).map(o => (
            <MenuItem key={o.value} textValue={o.label} className={mergeClasses(o.value === value?.range && 'bg-background-100')}>
              <MenuItemLabel className="px-2">{o.label}</MenuItemLabel>
            </MenuItem>
        ))}
      </Menu>
  )
}

export default MenuDatePeriodSelect
