import {VStack} from '@/components/ui/vstack'
import {Text} from '@/components/ui/text'
import {Heading} from '@/components/ui/heading'
import {Box} from '@/components/ui/box'
import {useState} from 'react'
import {PieChart} from 'react-native-gifted-charts'
import Colors from '@/constants/colors'
import {nonEmpty} from '@/utils/arrays'
import {printAmount} from '@/utils/transactions'

const prepareChartData = (items, mode) => {
  let total = 0

  if (items.length === 0) {
    return {total, data: [{value: 100, color: Colors[mode].tabIconDefault}]}
  }
  const transactionsByCategory = items.reduce((acc, tx) => {
    const catId = tx.category.id
    if (!acc[catId]) {
      acc[catId] = {transactions: [], totalAmount: 0, category: tx.category}
    }
    total += tx.amount.value
    acc[catId].totalAmount += tx.amount.value
    acc[catId].transactions.push(tx)
    return acc
  }, {})

  const data = Object.values(transactionsByCategory).map((group) => ({
    transactions: group.transactions,
    color: group.category.color,
    value: group.totalAmount,
    category: group.category,
  })).sort((a, b) => a.category.name.localeCompare(b.category.name))

  return {data, total}
}

const focusItem = (items, index) => items.map((d, i) => i === index ? { ...d, focused: true } : { ...d, focused: false })

const TransactionPieChart = ({items, mode, currency, kind, onChartPress}) => {
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
      <Box className="w-full flex items-center justify-center my-1">
        <PieChart
            sectionAutoFocus
            onPress={handlePress}
            data={data}
            donut
            radius={105}
            innerRadius={75}
            innerCircleColor={Colors[mode].background}
            strokeColor={Colors[mode].background}
            strokeWidth={1}
            centerLabelComponent={() => (
                <VStack className="items-center justify-center">
                  <Text size="md">{kind === 'expense' ? 'Spent' : 'Received'}</Text>
                  <Heading size="2xl">
                    {printAmount(total, currency, false)}
                  </Heading>
                </VStack>
            )}
        />
      </Box>
  )
}

export default TransactionPieChart