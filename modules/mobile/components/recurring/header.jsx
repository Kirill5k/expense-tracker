import {Divider} from '@/components/ui/divider'
import {HStack} from '@/components/ui/hstack'
import {VStack} from '@/components/ui/vstack'
import {Text} from '@/components/ui/text'
import {Heading} from '@/components/ui/heading'
import {printAmount, isExpense} from '@/utils/transactions'
import Classes from '@/constants/classes'

const DAY_IN_MS = 1000 * 60 * 60 * 24

const calculateMonthlyTotal = (transactions, currentDate) => {
  const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  let totalAmount = 0

  for (const transaction of transactions) {
    const {recurrence, amount} = transaction
    let occurrences = 0

    const transactionStart = new Date(recurrence.startDate)
    const transactionEnd = recurrence.endDate ? new Date(recurrence.endDate) : null

    if ((transactionStart <= currentMonthEnd) && (!transactionEnd || transactionEnd >= currentMonthStart)) {
      switch (recurrence.frequency) {
        case 'daily':
          const dailyStart = Math.max(currentMonthStart, transactionStart)
          const dailyEnd = Math.min(currentMonthEnd, transactionEnd || currentMonthEnd)
          occurrences = Math.floor((dailyEnd - dailyStart) / (recurrence.interval * DAY_IN_MS))
          break;
        case 'weekly':
          const weeklyStart = Math.max(currentMonthStart, transactionStart)
          const weeklyEnd = Math.min(currentMonthEnd, transactionEnd || currentMonthEnd)
          occurrences = Math.floor((weeklyEnd - weeklyStart) / (recurrence.interval * 7 * DAY_IN_MS))
          break;
        case 'monthly':
          occurrences = recurrence.interval === 1 ? 1 : 0
          break;
        default:
          occurrences = 0
      }

      if (isExpense(transaction)) {
        totalAmount -= occurrences * amount.value
      } else {
        totalAmount += occurrences * amount.value
      }
    }
  }

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

  const monthTotal = calculateMonthlyTotal(items, currentDate)

  if (!items?.length) {
    return null
  }

  return (
      <HStack className={Classes.listItemHeader}>
        <VStack className="w-2/4">
          <Text>This Month's Total</Text>
          <Heading size="xl">{printAmount(monthTotal, items[0]?.amount?.currency)}</Heading>
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
