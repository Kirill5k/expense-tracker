import {format, isToday, isYesterday, parseISO} from "date-fns";

export const calcTotal = (transactions) => {
  if (!transactions.length) {
    return '0';
  }

  const total = transactions.reduce((acc, transaction) => {
    const value = transaction.amount.value;
    return isExpense(transaction) ? acc - value : acc + value;
  }, 0);

  return printAmount(total, transactions[0].amount.currency)
}

export const formatAmount = (tx) => {
  const amount = isExpense(tx) ? (0 - tx.amount.value) : tx.amount.value
  return printAmount(amount, tx.amount.currency)
}

export const printAmount = (total, currency) =>
    `${total < 0 ? '-' : '+'}${currency.symbol}${Math.abs(total).toFixed(2)}`

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

// Performs binary search while assuming that txs array is sorted by date field
export const withinDates = (txs, {start, end}) => {
  const asc = txs.length < 2 || txs[0].date <= txs[txs.length - 1].date
  const startDate = format(start, 'yyyy-MM-dd')
  const endDate = format(end, 'yyyy-MM-dd')
  const startIdx = binarySearchDateIndex(txs, startDate, (mid, target) => asc ? mid < target : mid >= target);
  const endIdx = binarySearchDateIndex(txs, endDate, (mid, target) => asc ? mid <= target : mid > target);

  return asc ? txs.slice(startIdx, endIdx) : txs.slice(endIdx, startIdx)
}

const binarySearchDateIndex = (array, targetDate, comparator) => {
  let low = 0
  let high = array.length - 1
  let result = array.length

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const midDate = array[mid].date

    if (comparator(midDate, targetDate)) {
      low = mid + 1
    } else {
      result = mid
      high = mid - 1
    }
  }
  return result
}

export const sorts = {
  byDate: (desc) => (a, b) => desc ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
  byAmount: (desc) => (a, b) => desc ? a.amount.value - b.amount.value : b.amount.value - a.amount.value
}
