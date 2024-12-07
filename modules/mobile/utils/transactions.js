import {format, isToday, isYesterday, parseISO} from 'date-fns'

export const calcTotal = (transactions) => {
  if (!transactions?.length) {
    return 0;
  }

  return transactions.reduce((acc, transaction) => {
    const value = transaction.amount.value;
    return isExpense(transaction) ? acc - value : acc + value;
  }, 0)
}

export const formatAmount = (tx) => {
  const amount = isExpense(tx) ? (0 - tx.amount.value) : tx.amount.value
  return printAmount(amount, tx.amount.currency)
}

export const printAmount = (total, currency, withSign = true) => {
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: total > 10000 ? 0 : 2,
    maximumFractionDigits: total > 10000 ? 0 : 2,
  }).format(Math.abs(total))

  const sign = withSign ? (total < 0 ? '-' : '+') : '';

  return `${sign}${currency ? currency.symbol : ''}${formattedNumber}`
}

export const formatDate = (tx) => {
  const date = parseISO(tx.date);
  if (isToday(date)) {
    return 'Today'
  }
  if (isYesterday(date)) {
    return 'Yesterday'
  }
  return format(date, 'd MMMM')
}

export const isExpense = tx => tx.category.kind === 'expense'

export const withUpdatedCategory = (tx, catUpdates) => ({...tx, category: {...tx.category, ...catUpdates}})

export const generateRecurrences = ({recurrence, amount, categoryId, id, tags, note, userId}, now = new Date()) => {
  const startDate = recurrence.nextDate ? new Date(recurrence.nextDate) :new Date(recurrence.startDate)
  const endDate = recurrence.endDate ? new Date(recurrence.endDate) : new Date()

  let currentDate = new Date(startDate)
  const transactions = []
  while (currentDate < endDate && currentDate <= now) {
    transactions.push({
      parentTransactionId: id,
      isRecurring: true,
      amount,
      categoryId,
      tags,
      note,
      userId,
      date: currentDate.toISOString().split('T')[0]
    })

    switch (recurrence.frequency) {
      case "daily":
        currentDate.setDate(currentDate.getDate() + recurrence.interval)
        break;
      case "weekly":
        currentDate.setDate(currentDate.getDate() + (recurrence.interval * 7))
        break;
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + recurrence.interval)
        break;
      default:
        throw new Error("Unsupported frequency")
    }
  }

  return {
    transactions,
    recurringTransaction: {
      amount,
      categoryId,
      id,
      tags,
      note,
      userId,
      recurrence: {...recurrence, nextDate: currentDate.toISOString().split('T')[0]}
    }
  }
}
