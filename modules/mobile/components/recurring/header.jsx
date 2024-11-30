import {Divider} from '@/components/ui/divider'
import {HStack} from '@/components/ui/hstack'
import {VStack} from '@/components/ui/vstack'
import {Text} from '@/components/ui/text'
import {Heading} from '@/components/ui/heading'
import {calcTotal, printAmount, formatAmount, formatDate, isExpense} from '@/utils/transactions'
import { getDaysInMonth } from 'date-fns'

const calculateMonthlyTotal = (txs, daysInMonth = 30) => {
  let totalAmount = 0

  txs.forEach(tx => {
    const {recurrence, amount} = tx
    let occurrences = 0

    switch (recurrence.frequency) {
      case 'daily':
        occurrences = Math.floor(daysInMonth / recurrence.interval)
        break;
      case 'weekly':
        occurrences = Math.floor((daysInMonth / 7) / recurrence.interval)
        break;
      case 'monthly':
        occurrences = recurrence.interval === 1 ? 1 : 0
        break;
      default:
        occurrences = 0
    }

    if (isExpense(tx)) {
      totalAmount -= occurrences * amount.value
    } else {
      totalAmount += occurrences * amount.value
    }
  })

  return totalAmount
}

const RecurringTransactionHeader = ({items}) => {
  const currentDate = new Date()
  const nextWeekDate = new Date(currentDate);
  nextWeekDate.setDate(currentDate.getDate() + 7);

  const nextWeekTxs = items?.filter((tx) => {
    const txDate = new Date(tx.recurrence.nextDate)
    return txDate >= currentDate && txDate < nextWeekDate
  })

  const monthTotal = calculateMonthlyTotal(items, getDaysInMonth(currentDate))

  if (!items?.length) {
    return null
  }

  return (
      <HStack className="mb-2 p-3 rounded-xl bg-background-50 justify-between">
        <VStack className="w-2/4">
          <Text>Monthly Recurring</Text>
          <Heading size="xl">{printAmount(monthTotal, nextWeekTxs[0].amount.currency)}</Heading>
        </VStack>
        <Divider orientation="vertical"/>
        <VStack className="pl-3 w-2/4">
          <Text>Next 7 Days</Text>
          <Heading size="xl">{nextWeekTxs.length} transaction{nextWeekTxs.length === 1 ? '' : 's'}</Heading>
        </VStack>
      </HStack>
  )
}

export default RecurringTransactionHeader
