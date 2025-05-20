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

export const formatDate = (value) => {
  const date = typeof value === 'string' ? parseISO(value) : parseISO(value.date) ;
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
      date: format(currentDate, 'yyyy-MM-dd')
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
      recurrence: {...recurrence, nextDate: currentDate && format(currentDate, 'yyyy-MM-dd')},
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

  return format(currentNextDate, 'yyyy-MM-dd')
}

export const calculateLastOccurrenceDate = ({recurrence}) => {
  const {startDate, endDate, frequency, interval} = recurrence

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

  return format(lastOccurrence, 'yyyy-MM-dd')
}

export const filterBy = (transactions, searchQuery, filters) => {
  if (!searchQuery && !filters.categories.length && !filters.maxAmount && !filters.minAmount) {
    return transactions
  }

  const keywords = searchQuery?.split(/[\s,]+/)?.filter(Boolean)
  const categoryIds =  new Set(filters.categories)
  return transactions.filter(tx => matchesQuery(tx, keywords) && matchesFilters(tx, categoryIds, filters.minAmount, filters.maxAmount))
}

const matchesFilters = (tx, categoryIds, minAmount = 0, maxAmount = Number.MAX_VALUE) => {
  return (categoryIds.size ? categoryIds.has(tx.categoryId) : true)
      && tx.amount.value >= minAmount
      && tx.amount.value <= maxAmount
}

const matchesQuery = ({tags, category, note}, keywords) => {
  if (!keywords?.length) {
    return true
  }
  return keywords.every(keyword => {
    const lowerKeyword = keyword.toLowerCase()
    const inCategory = category.name.toLowerCase().includes(lowerKeyword)
    const inNote = note ? note.toLowerCase().includes(lowerKeyword) : false
    const inTags = (tags || []).some(tag => tag.toLowerCase().includes(lowerKeyword))
    return inCategory || inNote || inTags
  })
}