import {useState} from 'react'
import {VStack} from '@/components/ui/vstack'
import {Text} from '@/components/ui/text'
import {Heading} from '@/components/ui/heading'
import {getDaysInMonth} from 'date-fns'
import {BarChart, yAxisSides} from 'react-native-gifted-charts'
import Colors from '@/constants/colors'
import {nonEmpty, zipFlat} from '@/utils/arrays'
import {printAmount} from '@/utils/transactions'


const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const weeks = ['1-7', '8-14', '15-21', '22-28']
const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

const percentageChangeLabel = (currentTotal, previousTotal, displayDate) => {
  if (currentTotal === 0 || previousTotal === 0) {
    return ' '
  }

  const change = ((currentTotal - previousTotal) / previousTotal) * 100
  const sign = change >= 0 ? '+' : '-'
  return `${sign}${Math.abs(change).toFixed(0)}% from previous ${displayDate.range.replaceAll('ly', '')}`
}

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

const calcSpacing = (chartWidth, range) => {
  switch (range) {
    case 'weekly':
      return chartWidth / 22
    case 'monthly':
      return chartWidth / 16
    default:
      return chartWidth / 42
  }
}

const calcBarWidth = (chartWidth, range) => {
  switch (range) {
    case 'weekly':
      return chartWidth / 10
    case 'monthly':
      return chartWidth / 7
    default:
      return chartWidth / 17
  }
}

const calcLabelWidth = (range) => {
  switch (range) {
    case 'weekly':
      return 26
    case 'monthly':
      return 42
    default:
      return 14
  }
}

const prepareChartData = (items, displayDate) => {
  let total = 0

  const transactionsByDateRange = items.reduce((acc, tx) => {
    const bucketNumber = getBucketNumberForDateRange(tx, displayDate.range)
    total += tx.amount.value
    acc[bucketNumber].totalAmount += tx.amount.value
    acc[bucketNumber].transactions.push(tx)
    return acc
  }, new Array(getNumberOfBucketsForDateRange(displayDate.range)).fill(null).map(() => ({transactions: [], totalAmount: 0.0})))

  const labelWidth = calcLabelWidth(displayDate.range)
  const data = transactionsByDateRange.map((group, i) => {
    const baseData = {spacing: 0, index: i, value: group.totalAmount, transactions: group.transactions, labelWidth}
    switch (displayDate.range) {
      case 'weekly':
        return {label: days[i], ...baseData}
      case 'monthly':
        const daysInMonth = getDaysInMonth(displayDate.start)
        const label = i < 4 ? weeks[i] : daysInMonth === 28 ? '' : `29-${daysInMonth}`
        return {label, ...baseData}
      default:
        return {label: months[i], ...baseData}
    }
  })
  return {total, data, average: Math.floor(total / data.length)}
}

const focusItem = (items, index, mode, kind) => items.map((d, i) => {
  return i === index
      ? {...d, frontColor: Colors[mode][kind].barChartMain}
      : {...d, frontColor: Colors[mode][kind].barChartSecondary}
})

const TransactionBarChart = ({items, previousPeriodItems, mode, displayDate, currency, chartWidth, kind, onChartPress}) => {
  const [pressedItem, setPressedItem] = useState(null)

  const chartData = prepareChartData(items, displayDate)
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

  const previousPeriodChartData = prepareChartData(previousPeriodItems, displayDate)
  const previousData = previousPeriodChartData.data.map(i => ({value: i.value, disablePress: true, frontColor: Colors[mode][kind].barChartSecondary}))
  const previousTotal = previousPeriodChartData.total

  const zippedData = zipFlat(data, previousData)

  return (
      <VStack>
        <Text size="md">{kind === 'expense' ? 'Spent' : 'Received'}</Text>
        <Heading size="3xl">{printAmount(total, currency, false)}</Heading>
        <Text size="sm" className="py-0 mb-1">{pressedItem ? ' ' : percentageChangeLabel(total, previousTotal, displayDate)}</Text>
        <BarChart
            spacing={calcSpacing(chartWidth, displayDate.range)}
            barWidth={calcBarWidth(chartWidth, displayDate.range) / 2}
            frontColor={Colors[mode][kind].barChartMain}
            height={132}
            width={chartWidth}
            initialSpacing={10}
            roundToDigits={0}
            yAxisSide={yAxisSides.RIGHT}
            roundedBottom={false}
            barBorderTopLeftRadius={4}
            barBorderTopRightRadius={4}
            data={zippedData}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={Colors[mode].tabIconDefault}
            yAxisTextStyle={{color: Colors[mode].text, fontSize: 12, lineHeight: 16, textAlign: 'right'}}
            xAxisLabelTextStyle={{color: Colors[mode].text, fontSize: 12, lineHeight: 16}}
            noOfSections={1}
            onPress={handleItemPress}
            showReferenceLine1
            referenceLine1Position={chartData.average}
            referenceLine1Config={{
              color: pressedItem ? Colors[mode][kind].barChartSecondary : Colors[mode][kind].barChartMain,
              dashWidth: 5,
              dashGap: 7,
              zIndex: -1,
              labelText: chartData.average === 0 ? '' : `${chartData.average}`,
              labelTextStyle: {
                color: pressedItem ? Colors[mode][kind].barChartSecondary : Colors[mode][kind].barChartMain,
                textAlign: 'right',
                width: '100%',
                marginLeft: 26 + (displayDate.range === 'yearly' ? 4 : 0),
                marginTop: -7,
                fontSize: 12
              }
            }}
        />
      </VStack>
  )
}

export default TransactionBarChart