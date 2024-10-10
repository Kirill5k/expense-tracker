import {format, startOfMonth, endOfMonth} from 'date-fns'

export const defaultDisplayDate = () => {
  const now = new Date()
  return {range: 'monthly', start: startOfMonth(now), end: endOfMonth(now), text: format(now, 'LLLL yyyy')}
}