import {useState} from 'react'
import {VStack} from '@/components/ui/vstack'
import {Text} from '@/components/ui/text'
import {Heading} from '@/components/ui/heading'
import {getDaysInMonth} from 'date-fns'
import {BarChart, yAxisSides} from 'react-native-gifted-charts'
import Colors from '@/constants/colors'
import {nonEmpty} from '@/utils/arrays'
import {printAmount} from '@/utils/transactions'


const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const weeks = ['1-7', '8-14', '15-21', '22-28']
const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

const getNumberOfBucketsForDateRange = (range) => {
  switch (range) {
    case 'weekly':
      return 7
    case 'monthly':
      return 5
    default:
      return 12
  }
}

const getBucketNumberForDateRange = (tx, range) => {
  const date = new Date(tx.date)
  switch (range) {
    case 'weekly':
      return date.getDay()
    case 'monthly':
      return Math.floor(date.getDate() / 7)
    default:
      return date.getMonth()
  }
}


const prepareChartData = (items, displayDate, chartWidth) => {
  let total = 0

  const transactionsByDateRange = items.reduce((acc, tx) => {
    const bucketNumber = getBucketNumberForDateRange(tx, displayDate.range)
    total += tx.amount.value
    acc[bucketNumber].totalAmount += tx.amount.value
    acc[bucketNumber].transactions.push(tx)
    return acc
  }, new Array(getNumberOfBucketsForDateRange(displayDate.range)).fill(null).map(() => ({transactions: [], totalAmount: 0.0})))

  const data = transactionsByDateRange.map((group, i) => {
    const baseData = {index: i, value: group.totalAmount, transactions: group.transactions}
    switch (displayDate.range) {
      case 'weekly':
        return {spacing: chartWidth / 22, barWidth: chartWidth / 10, label: days[i], ...baseData}
      case 'monthly':
        const daysInMonth = getDaysInMonth(displayDate.start)
        const label = i < 4 ? weeks[i] : daysInMonth === 28 ? '' : `29-${daysInMonth}`
        return {spacing: chartWidth / 16, barWidth: chartWidth / 7, label, ...baseData}
      default:
        return {spacing: chartWidth / 42, barWidth: chartWidth / 17, label: months[i], ...baseData}
    }
  })
  return {total, data, average: Math.floor(total / data.length)}
}

const focusItem = (items, index, mode, kind) => items.map((d, i) => {
  return i === index
      ? {...d, frontColor: Colors[mode][kind].barChartMain}
      : {...d, frontColor: Colors[mode][kind].barChartSecondary}
})

const TransactionBarChart = ({items, mode, displayDate, currency, chartWidth, kind, onChartPress}) => {
  const [pressedItem, setPressedItem] = useState(null)

  const chartData = prepareChartData(items, displayDate, chartWidth)
  const [data, total] = pressedItem
      ? [focusItem(chartData.data, pressedItem.index, mode, kind), pressedItem.value]
      : [chartData.data, chartData.total]

  const [prevItems, setPrevItems] = useState(items)
  if (items.length !== prevItems.length || (nonEmpty(items) && nonEmpty(prevItems) && items[0].id !== prevItems[0].id)) {
    setPressedItem(null)
    setPrevItems(items)
  }

  const handleItemPress = (item) => {
    if (pressedItem?.index === item.index) {
      setPressedItem(null)
      onChartPress([])
    } else {
      setPressedItem({index: item.index, value: item.value})
      onChartPress(item.transactions)
    }
  }

  return (
      <VStack>
        <Text size="xs">{kind === 'expense' ? 'Spent' : 'Received'}</Text>
        <Heading size="xl" className="mb-4">{printAmount(total, currency, false)}</Heading>
        <BarChart
            frontColor={Colors[mode][kind].barChartMain}
            height={120}
            width={chartWidth}
            initialSpacing={10}
            roundToDigits={0}
            yAxisSide={yAxisSides.RIGHT}
            roundedBottom={false}
            barBorderTopLeftRadius={4}
            barBorderTopRightRadius={4}
            data={data}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={Colors[mode].tabIconDefault}
            yAxisTextStyle={{color: Colors[mode].text, fontSize: 12, lineHeight: 16, textAlign: 'right'}}
            xAxisLabelTextStyle={{color: Colors[mode].text, fontSize: 12, lineHeight: 16}}
            noOfSections={3}
            onPress={handleItemPress}
            showReferenceLine1
            referenceLine1Position={chartData.average}
            referenceLine1Config={{
              color: pressedItem ? Colors[mode][kind].barChartSecondary : Colors[mode][kind].barChartMain,
              dashWidth: 2,
              dashGap: 3,
              zIndex: -1
            }}
        />
      </VStack>
  )
}

export default TransactionBarChart