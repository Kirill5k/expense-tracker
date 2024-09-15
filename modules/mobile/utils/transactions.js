export const calcTotal = (transactions) => {
  if (!transactions.length) {
    return '0';
  }

  const currencySymbol = transactions[0].amount.currency.symbol;
  const total = transactions.reduce((acc, transaction) => {
    const value = transaction.amount.value;
    return transaction.kind === 'expense' ? acc - value : acc + value;
  }, 0);

  return printAmount(total, currencySymbol)
}

export const formatAmount = (tx) => {
  const currencySymbol = tx.amount.currency.symbol;
  const amount = tx.kind === 'expense' ? (0 - tx.amount.value) : tx.amount.value
  return printAmount(amount, currencySymbol)
}

const printAmount = (total, currencySymbol) =>
    `${total < 0 ? '-' : '+'}${currencySymbol}${Math.abs(total).toFixed(2)}`