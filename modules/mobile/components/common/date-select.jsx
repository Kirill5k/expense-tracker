import React, {useState} from 'react'
import DateTimePicker from 'react-native-ui-datepicker'
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionTitleText,
  AccordionContent,
  AccordionIcon,
} from '@/components/ui/accordion'
import {Switch} from '../ui/switch'
import {Fab, FabLabel} from '../ui/fab'
import {Box} from '../ui/box'
import {MaterialIcon} from '../ui/icon';
import Classes from '@/constants/classes'
import Colors from '@/constants/colors'
import {mergeClasses} from '@/utils/css'
import {format} from 'date-fns'


const AccordionDateSelect = ({value, onSelect, mode, isInvalid, nullable = false, flat = false}) => {
  const [enabled, setEnabled] = useState(!!value)
  const [selectedValues, setSelectedValues] = useState([])

  const formatDate = (date) => {
    if (date) {
      return format(date, 'dd MMM yyyy')
    }
    return ''
  }

  const handleEnabledToggle = () => {
    if (enabled) {
      setSelectedValues([])
      onSelect(null)
    } else {
      setSelectedValues(['a'])
      onSelect(new Date())
    }
    setEnabled(!enabled)
  }

  return (
      <Accordion
          value={selectedValues}
          onValueChange={(item) => setSelectedValues(item)}
          size="md"
          variant="unfilled"
          type="single"
          isCollapsible={true}
          isDisabled={!enabled}
          className={mergeClasses(
              'border rounded-md',
              flat && 'border-0 bg-background-50',
              flat && !nullable && 'p-0.5',
              flat && selectedValues.length && 'bg-background-100',
              !flat && Classes[mode].inputFieldBorder
          )}
          style={{
            borderColor: isInvalid ? Colors[mode].borderInvalid : Colors[mode].border
          }}
      >
        <AccordionItem value="a">
          <AccordionHeader>
            <AccordionTrigger className={mergeClasses('px-3 py-0', !nullable && 'pr-5')}>
              {({ isExpanded }) => {
                return (
                    <>
                      {enabled && <Box className="pl-1.5">
                        <AccordionIcon
                            as={MaterialIcon}
                            code="calendar"
                            dsize={20}
                            dcolor={Colors[mode].text}
                        />
                      </Box>}
                      <AccordionTitleText className="pl-2 font-semibold py-2">
                        {formatDate(value)}
                      </AccordionTitleText>
                      {!nullable && (
                          <AccordionIcon
                              className="flex-grow-0"
                              as={MaterialIcon}
                              code={isExpanded ? 'chevron-up' : 'chevron-down'}
                              dcolor={value ? Colors[mode].tabIconSelected : Colors[mode].text}
                          />
                      )}
                      {nullable && (
                          <Switch
                              value={enabled}
                              onToggle={handleEnabledToggle}
                              className="mx-0 my-1 p-0"
                              size="sm"
                              trackColor={{ false: Colors[mode].text, true: Colors[mode].tabIconSelected }}
                          />
                      )}
                    </>
                )
              }}
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionContent className="pb-1">
            <DateSelect
                value={value}
                mode={mode}
                onSelect={onSelect}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
  )
}



const DateSelect = ({value, onSelect, mode}) => {

  const handleDateChange = ({date}) => {
    onSelect(new Date(date))
  }

  const selectedContainer = 'rounded rounded-full bg-primary-500 m-0.5'
  const selectedText = 'text-background-0'

  if (!value) {
    return null
  }

  return (
      <Box className="pb-8">
        <DateTimePicker
            containerHeight={240}
            mode="single"
            date={value}
            onChange={handleDateChange}
            navigationPosition="right"
            headerButtonColor={Colors[mode].tint}
            selectedItemColor={Colors[mode].tint}
            classNames={{
              selected_month: selectedContainer,
              selected_year: selectedContainer,
              selected: selectedContainer,
              selected_year_label: selectedText,
              selected_month_label: selectedText,
              selected_label: selectedText,

              month_selector_label: 'text-primary-500 text-lg font-semibold',
              year_selector_label: 'text-primary-500 text-lg font-semibold',
              outside_label: 'text-secondary-300 text-md',
              day_label: 'text-primary-500 text-md',
              month_label: 'text-primary-500 text-md',
              year_label: 'text-primary-500 text-md',
              active_year_label: 'text-primary-500 text-md',
              weekdays: 'border-b border-b-2 border-primary-300 pb-1 mb-1',
              weekday_label: 'text-secondary-600 text-md',
              today: 'rounded rounded-full border-primary-500 border-2 m-0.5',
              today_label: 'text-primary-500 text-md',
            }}
        />
        <Fab
            size="sm"
            placement="bottom right"
            className={mergeClasses(
                'right-3 bottom-3 rounded-lg px-0 py-1.5 bg-primary-500',
            )}
            onPress={() => onSelect(new Date())}
        >
          <FabLabel className="font-bold">Today</FabLabel>
        </Fab>
      </Box>
  )
}

export default AccordionDateSelect