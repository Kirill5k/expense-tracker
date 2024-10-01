import {useEffect, useState} from 'react'
import {HStack} from '@/components/ui/hstack'
import {VStack} from '@/components/ui/vstack'
import {Text} from '@/components/ui/text'
import {Heading} from '@/components/ui/heading'
import {Button, ButtonIcon} from '@/components/ui/button'
import {MaterialIcon} from '@/components/ui/icon'
import {Dimensions} from 'react-native'
import {getDaysInMonth} from 'date-fns'
import {BarChart, yAxisSides} from 'react-native-gifted-charts'
import Colors from '@/constants/colors'

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


const prepareChartData = (items, displayDate) => {
  const screenWidth = Dimensions.get('window').width
  const chartWidth = screenWidth - 92

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
  return {total, data, average: Math.floor(total / data.length), chartWidth}
}

const TransactionChart = ({items, mode, displayDate, currency}) => {
  const [showPieChart, setShowPieChart] = useState(false)
  const chartData = prepareChartData(items, displayDate)
  const [pressedItem, setPressedItem] = useState(null)
  const [data, setData] = useState(chartData.data)
  const [total, setTotal] = useState(chartData.total)
  const frontColor = Colors[mode].barChartMain
  const frontColorSecondary = Colors[mode].barChartSecondary

  const handleItemPress = (item) => {
    if (pressedItem?.index === item.index) {
      setData(chartData.data)
      setTotal(chartData.total)
      setPressedItem(null)
    } else {
      setPressedItem(item)
      setData(data.map((d, i) => i === item.index ? {...d, frontColor} : {...d, frontColor: frontColorSecondary}))
      setTotal(item.value)
    }
  }

  useEffect(() => {
    const chartData = prepareChartData(items, displayDate)
    setData(chartData.data)
    setTotal(chartData.total)
    setPressedItem(null)
  }, [items]);

  return (
      <VStack className="items-center">
        <HStack className="w-full justify-between">
          <VStack className="mb-4">
            <Text size="xs">Spent</Text>
            <Heading size="xl">{currency?.symbol}{total.toFixed(2)}</Heading>
          </VStack>
          <Button size="md" className="rounded-full p-1 mx-3" variant="outline" onPress={() => setShowPieChart(true)}>
            <ButtonIcon as={MaterialIcon} code="chart-donut" dsize={26} dcolor={Colors[mode].text} />
          </Button>
        </HStack>
        <BarChart
            frontColor={frontColor}
            height={120}
            width={chartData.chartWidth}
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
            // showReferenceLine1
            // referenceLine1Position={chartData.average}
            // referenceLine1Config={{
            //   color: '#177AD5',
            //   dashWidth: 1000,
            //   dashGap: 0,
            // }}
        />
      </VStack>
  )
}

export default TransactionChart