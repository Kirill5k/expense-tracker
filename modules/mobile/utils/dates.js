import {format, startOfMonth, endOfMonth, subMonths} from 'date-fns'

export const defaultDisplayDate = () => {
  const now = new Date()
  return {
    range: 'monthly',
    prevStart: startOfMonth(subMonths(now, 1)),
    start: startOfMonth(now),
    end: endOfMonth(now),
    text: format(now, 'LLLL yyyy')
  }
}

export const toIsoDateString = (date) => {
  return date.getFullYear() +
      '-' + (date.getMonth() + 1).toString().padStart(2, '0') +
      '-' + date.getDate().toString().padStart(2, '0')
}