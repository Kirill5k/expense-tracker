import {format, isToday, isYesterday, parseISO, addDays, addWeeks, addMonths} from 'date-fns'

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

  const sign = withSign && total !== 0 ? (total < 0 ? '-' : '+') : '';

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

export const generateRecurrences = (rtx, now = new Date()) => {
  const recurrence = rtx.recurrence
  const startDate = recurrence.nextDate ? parseISO(recurrence.nextDate) : parseISO(recurrence.startDate)
  const endDate = recurrence.endDate ? parseISO(recurrence.endDate) : null

  let currentDate = startDate
  const transactions = []
  while ((endDate ? currentDate < endDate : true) && currentDate <= now) {
    transactions.push({
      ...rtx,
      parentTransactionId: rtx.id,
      isRecurring: true,
      date: currentDate.toISOString().split('T')[0]
    })

    currentDate = addInterval(currentDate, recurrence)
  }

  if (endDate && endDate <= currentDate) {
    currentDate = null
  }

  return {
    transactions,
    recurringTransaction: {
      ...rtx,
      recurrence: {...recurrence, nextDate: currentDate && currentDate.toISOString().split('T')[0]}
    }
  }
}

const addInterval = (date, {frequency, interval}) => {
  switch (frequency) {
    case 'daily':
      return addDays(date, interval);
    case 'weekly':
      return addWeeks(date, interval);
    case 'monthly':
      return addMonths(date, interval);
    default:
      throw new Error('Unsupported frequency');
  }
}

export const calculateRecurrenceNextDate = ({recurrence}, dateAfter) => {
  const referenceDate = dateAfter ? parseISO(dateAfter) : new Date()
  const endDate = recurrence.endDate ? parseISO(recurrence.endDate) : null

  let currentNextDate = parseISO(recurrence.startDate)
  while ((endDate ? currentNextDate < endDate : true) && currentNextDate <= referenceDate) {
    currentNextDate = addInterval(currentNextDate, recurrence)
  }

  if (endDate && endDate <= currentNextDate) {
    return null
  }

  return currentNextDate.toISOString().split('T')[0]
}

export const calculateLastOccurrenceDate = ({recurrence}) => {
  const { startDate, endDate, frequency, interval } = recurrence

  if (!endDate || startDate > endDate) {
    return null
  }

  const start = parseISO(startDate)
  const end = parseISO(endDate)

  let lastOccurrence = start
  while (true) {
    const nextOccurrence = addInterval(lastOccurrence, {frequency, interval})
    if (nextOccurrence >= end) {
      break
    }
    lastOccurrence = nextOccurrence
  }

  return lastOccurrence.toISOString().split('T')[0]
}

export const filterBySearchQuery = (transactions, searchQuery) => {
  if (!searchQuery) {
    return transactions
  }

  const keywords = searchQuery.split(/[\s,]+/).filter(Boolean)
  return transactions.filter(({ tags, category, note }) => {
    return keywords.every(keyword => {
      const lowerKeyword = keyword.toLowerCase()
      const inCategory = category.name.toLowerCase().includes(lowerKeyword)
      const inNote = note ? note.toLowerCase().includes(lowerKeyword) : false
      const inTags = (tags || []).some(tag => tag.toLowerCase().includes(lowerKeyword))
      return inCategory || inNote || inTags
    })
  })
}

export const filterByCategory = (transactions, catIds) => {
  if (!catIds || !catIds.length) {
    return transactions
  }

  const ids = new Set(catIds)
  return transactions.filter(tx => ids.has(tx.categoryId))
}