import React, {useState} from 'react'
import {ScrollView} from '@/components/ui/scroll-view'
import {HStack} from '@/components/ui/hstack'
import {Divider} from '@/components/ui/divider'
import {Menu, MenuItem, MenuItemLabel} from '@/components/ui/menu'
import {ButtonIcon, ButtonText, Button} from '@/components/ui/button'
import {MaterialIcon} from '@/components/ui/icon'
import colors from '@/constants/colors'
import {mergeClasses} from '@/utils/css'
import ToggleButton from './toggle-button'
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

export const FlatDatePeriodSelect = ({disabled, value, onSelect, mode, className}) => {
  const dates = [incrementBy(value, -1), value, incrementBy(value, 1)]

  const handleRangeChange = (newRange) => {
    const newDateRange = newDisplayDateForToday(newRange.value)
    const previous = incrementBy(newDateRange, -1)
    const next = incrementBy(newDateRange, 1)
    // setDates([previous, newDateRange, next])
    onSelect({...newDateRange, previous, next})
  }

  const handleDateChange = (newDate) => {
    const newDateRange = newDate.value
    const previous = incrementBy(newDateRange, -1)
    const next = incrementBy(newDateRange, 1)
    // setDates([previous, newDateRange, next])
    onSelect({...newDateRange, previous, next})
  }

  return (
      <ScrollView
          bounces={false}
          horizontal
          className={`py-1 ${className}`}
          showsHorizontalScrollIndicator={false}
      >
        <HStack space="sm">
          <ToggleButton
              disabled={disabled}
              size="sm"
              onChange={handleDateChange}
              value={{value: dates[1], label: dates[1].text}}
              items={dates.map(v => ({value: v, label: v.text}))}
          />
          <Divider
              className="min-h-7"
              orientation="vertical"
          />
          <ToggleButton
              disabled={disabled}
              size="sm"
              value={ranges[value.range]}
              items={Object.values(ranges)}
              onChange={handleRangeChange}
          />
        </HStack>
      </ScrollView>
  )
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
                  className={`items-center justify-center ${className}`}
              >
                <Button
                    size="md"
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
                    size="md"
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
                    size="md"
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
        {Object.values(ranges).map(o => (
            <MenuItem key={o.value} textValue={o.label} className={mergeClasses(o.value === value?.range && 'bg-background-100')}>
              <MenuItemLabel className="px-2">{o.label}</MenuItemLabel>
            </MenuItem>
        ))}
      </Menu>
  )
}

export default MenuDatePeriodSelect
