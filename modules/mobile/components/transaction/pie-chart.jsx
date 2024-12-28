import {VStack} from '@/components/ui/vstack'
import {Text} from '@/components/ui/text'
import {Heading} from '@/components/ui/heading'
import {Box} from '@/components/ui/box'
import {useState} from 'react'
import {PieChart} from 'react-native-gifted-charts'
import Colors from '@/constants/colors'
import {nonEmpty} from '@/utils/arrays'
import {printAmount} from '@/utils/transactions'

const percentageChange = (currentTotal, previousTotal) => {
  if (!currentTotal || !previousTotal) {
    return ' '
  }

  const change = ((currentTotal - previousTotal) / previousTotal) * 100
  const sign = change >= 0 ? '+' : '-'
  return `${sign}${Math.abs(change).toFixed(0)}%`
}

const groupTxByCat = (items) => items.reduce((acc, tx) => {
  const catId = tx.category.id
  if (!acc.transactionsByCategory[catId]) {
    acc.transactionsByCategory[catId] = {transactions: [], totalAmount: 0, category: tx.category}
  }
  acc.total += tx.amount.value
  acc.transactionsByCategory[catId].totalAmount += tx.amount.value
  acc.transactionsByCategory[catId].transactions.push(tx)
  return acc
}, {total: 0, transactionsByCategory: {}})

const prepareChartData = (items, mode) => {
  if (items.length === 0) {
    return {total: 0, data: [{value: 100, color: Colors[mode].tabIconDefault}]}
  }
  const {total, transactionsByCategory} = groupTxByCat(items)

  const data = Object.values(transactionsByCategory).map((group) => ({
    transactions: group.transactions,
    color: group.category.color,
    value: group.totalAmount,
    category: group.category,
  })).sort((a, b) => a.category.name.localeCompare(b.category.name))

  return {data, total}
}

const focusItem = (items, index) => items.map((d, i) => i === index ? { ...d, focused: true } : { ...d, focused: false })

const TransactionPieChart = ({items, previousPeriodItems, mode, currency, kind, onChartPress}) => {
  const [pressedItem, setPressedItem] = useState(null)
  const chartData = prepareChartData(items, mode)

  const [prevItems, setPrevItems] = useState(items)
  if (items.length !== prevItems.length || (nonEmpty(items) && nonEmpty(prevItems) && items[0].id !== prevItems[0].id)) {
    setPressedItem(null)
    setPrevItems(items)
  }

  const [data, total] = pressedItem
      ? [focusItem(chartData.data, pressedItem.index), pressedItem.value]
      : [chartData.data, chartData.total]

  const prevData = groupTxByCat(previousPeriodItems)
  const prevTotal = pressedItem
      ? prevData.transactionsByCategory[chartData.data[pressedItem.index].category.id]?.totalAmount
      : prevData.total

  const handlePress = (item, i) => {
    if (pressedItem === i || !item.category) {
      setPressedItem(null)
      onChartPress([]);
    } else {
      setPressedItem({index: i, value: item.value})
      onChartPress(item.transactions)
    }
  }

  return (
      <Box className="w-full flex items-center justify-center my-1 pt-3">
        <PieChart
            sectionAutoFocus
            onPress={handlePress}
            data={data}
            donut
            radius={120}
            innerRadius={90}
            innerCircleColor={Colors[mode].splashScreenBackground}
            strokeColor={Colors[mode].splashScreenBackground}
            strokeWidth={4}
            centerLabelComponent={() => (
                <VStack className="items-center justify-center">
                  <Text size="md">{kind === 'expense' ? 'Spent' : 'Received'}</Text>
                  <Heading size="2xl">
                    {printAmount(total, currency, false)}
                  </Heading>
                  <Text size="md">{percentageChange(total, prevTotal)}</Text>
                </VStack>
            )}
        />
      </Box>
  )
}

export default TransactionPieChart