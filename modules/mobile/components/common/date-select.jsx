import DateTimePicker from 'react-native-ui-datepicker'
import {Fab, FabLabel} from '../ui/fab'
import {Box} from '../ui/box'
import colors from '@/constants/colors'
import {mergeClasses} from '@/utils/css'
import dayjs from 'dayjs'

const DateSelect = ({value, onSelect, mode}) => {
  const textStyle = {
    fontSize: 12,
    lineHeight: 20
  }

  const handleDateChange = (params) => {
    onSelect(params.date.toDate())
  }

  return (
      <Box className="border border-secondary-200 rounded-md pb-8">
        <DateTimePicker
            height={200}
            displayFullDays={false}
            mode="single"
            date={dayjs(value)}
            onChange={handleDateChange}
            headerButtonsPosition="right"
            headerButtonColor={colors[mode].tint}
            selectedItemColor={colors[mode].tint}
            selectedTextStyle={{
              fontWeight: 'bold',
              color: colors[mode].background,
              ...textStyle
            }}
            calendarTextStyle={{
              color: colors[mode].text,
              ...textStyle
            }}
            headerTextStyle={{
              fontWeight: 'bold',
              color: colors[mode].text,
            }}
            weekDaysTextStyle={{
              color: colors[mode].text,
              fontWeight: 600,
              ...textStyle
            }}
            todayTextStyle={{
              fontWeight: 'bold'
            }}
            dayContainerStyle={{
              borderRadius: 8
            }}
            todayContainerStyle={{
              borderRadius: 8
            }}
            headerContainerStyle={{
              height: 24
            }}
        />
        <Fab
            size="sm"
            placement="bottom right"
            className={mergeClasses(
                'right-1 bottom-2 rounded-lg px-0 py-1.5',
                mode === 'light' ? 'bg-blue-600' : 'bg-blue-300'
            )}
            onPress={() => onSelect(new Date())}
        >
          <FabLabel className="text-xs">Today</FabLabel>
        </Fab>
      </Box>
  )
}

export default DateSelect