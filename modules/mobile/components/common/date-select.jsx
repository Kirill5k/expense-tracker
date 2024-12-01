import {useState} from 'react'
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
import dayjs from 'dayjs'


const AccordionDateSelect = ({value, onSelect, mode, nullable = false}) => {
  const [enabled, setEnabled] = useState(!nullable)
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
          className={mergeClasses('border rounded-md', Classes[mode].inputFieldBorder)}
      >
        <AccordionItem value="a">
          <AccordionHeader>
            <AccordionTrigger className={mergeClasses('px-3 py-0', !nullable && 'pr-5')}>
              {({ isExpanded }) => {
                return (
                    <>
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
                              className="p-0 m-0"
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
  const textStyle = {
    fontSize: 16,
    lineHeight: 20
  }

  const handleDateChange = (params) => {
    onSelect(params.date.toDate())
  }

  return (
      <Box className="pb-8">
        <DateTimePicker
            height={240}
            displayFullDays={false}
            mode="single"
            date={dayjs(value)}
            onChange={handleDateChange}
            headerButtonsPosition="right"
            headerButtonColor={Colors[mode].tint}
            selectedItemColor={Colors[mode].tint}
            selectedTextStyle={{
              fontWeight: 600,
              color: Colors[mode].background,
              ...textStyle
            }}
            calendarTextStyle={{
              color: Colors[mode].text,
              ...textStyle
            }}
            headerTextStyle={{
              fontWeight: 500,
              color: Colors[mode].text,
              fontSize: 18,
              lineHeight: 18
            }}
            weekDaysTextStyle={{
              color: Colors[mode].textSecondary,
              fontSize: 14,
              lineHeight: 20
            }}
            todayTextStyle={{
              fontWeight: 600,
            }}
            dayContainerStyle={{
              height: 10
            }}
            todayContainerStyle={{
            }}
            headerContainerStyle={{
              height: 24
            }}
        />
        <Fab
            size="md"
            placement="bottom right"
            className={mergeClasses(
                'right-3 bottom-3 rounded-lg px-0 py-1.5',
                mode === 'light' ? 'bg-blue-600' : 'bg-blue-300'
            )}
            onPress={() => onSelect(new Date())}
        >
          <FabLabel className="font-bold">Today</FabLabel>
        </Fab>
      </Box>
  )
}

export default AccordionDateSelect