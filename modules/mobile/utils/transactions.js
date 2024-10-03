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

export const withinDates = (txs, {start, end}) => txs.filter(tx => {
  const txDate = new Date(tx.date)
  return start <= txDate && txDate <= end
})

export const sorts = {
  byDate: (desc) => (a, b) => desc ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
  byAmount: (desc) => (a, b) => desc ? a.amount.value - b.amount.value : b.amount.value - a.amount.value
}
