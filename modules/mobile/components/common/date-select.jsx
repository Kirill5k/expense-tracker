import DateTimePicker from 'react-native-ui-datepicker'
import {Fab, FabLabel} from '../ui/fab'
import {Box} from '../ui/box'
import Classes from '@/constants/classes'
import colors from '@/constants/colors'
import {mergeClasses} from '@/utils/css'
import dayjs from 'dayjs'

const DateSelect = ({value, onSelect, mode}) => {
  const textStyle = {
    fontSize: 16,
    lineHeight: 20
  }

  const handleDateChange = (params) => {
    onSelect(params.date.toDate())
  }

  return (
      <Box className={mergeClasses(
          'border rounded-md p-2 pb-8',
          Classes[mode].inputFieldBorder
      )}>
        <DateTimePicker
            height={240}
            displayFullDays={false}
            mode="single"
            date={dayjs(value)}
            onChange={handleDateChange}
            headerButtonsPosition="right"
            headerButtonColor={colors[mode].tint}
            selectedItemColor={colors[mode].tint}
            selectedTextStyle={{
              fontWeight: 600,
              color: colors[mode].background,
              ...textStyle
            }}
            calendarTextStyle={{
              color: colors[mode].text,
              ...textStyle
            }}
            headerTextStyle={{
              fontWeight: 500,
              color: colors[mode].text,
              fontSize: 18,
              lineHeight: 18
            }}
            weekDaysTextStyle={{
              color: colors[mode].textSecondary,
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

export default DateSelect