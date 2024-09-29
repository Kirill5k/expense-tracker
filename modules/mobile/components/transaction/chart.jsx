import {Box} from '@/components/ui/box'
import {getDaysInMonth} from 'date-fns'

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const weeks = ['1-7', '8-14', '15-21', '22-28']
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const weeklyBreakdown = new Array(7).fill(0)
const monthlyBreakdown = new Array(4).fill(0)
const yearlyBreakdown = new Array(12).fill(0)

const totalByDateRange = (range, txs) => {
  let result = [...yearlyBreakdown]
  if (range === 'weekly') {
    result = [...weeklyBreakdown]
  } else if (range === 'monthly') {
    result = [...monthlyBreakdown]
  }

  return txs.reduce((acc, tx) => {
    const date = new Date(tx)
    if (range === 'weekly') {
      acc[date.getDay()] += tx.amount.value
    } else if (range === 'monthly') {
      const bucket = Math.floor(date.getDate() / 7)
      acc[bucket] += tx.amount.value
    } else {
      acc[date.getMonth()] += tx.amount.value
    }

    return acc
  }, result)
}

const TransactionChart = ({items, mode, displayDate}) => {
  const data = totalByDateRange(displayDate.range, items).map((amount, i) => {
    if (displayDate.range === 'weekly') {
      return {x: days[i], y: amount}
    } else if (displayDate.range === 'monthly') {
      if (i < 4) {
        return {x: weeks[i], y: amount}
      } else {
        const daysInMonth = getDaysInMonth(displayDate.from)
        return daysInMonth === 28 ? null : `29-${daysInMonth}`
      }
    } else {
      return {x: months[i], y: amount}
    }
  })

  return (
      <Box>

      </Box>
  )
}

export default TransactionChart