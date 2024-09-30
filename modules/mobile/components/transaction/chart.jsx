import {useEffect, useState} from 'react'
import {Box} from '@/components/ui/box'
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

  const transactionsByDateRange = items.reduce((acc, tx) => {
    const bucketNumber = getBucketNumberForDateRange(tx, displayDate.range)
    acc[bucketNumber].totalAmount += tx.amount.value
    acc[bucketNumber].transactions.push(tx)
    return acc
  }, new Array(getNumberOfBucketsForDateRange(displayDate.range)).fill(null).map(() => ({transactions: [], totalAmount: 0.0})))

  return transactionsByDateRange.map((group, i) => {
    const baseData = {index: i, value: group.totalAmount, transactions: group.transactions}
    switch (displayDate.range) {
      case 'weekly':
        return {spacing: screenWidth / 30, barWidth: screenWidth / 13.5, label: days[i], ...baseData}
      case 'monthly':
        const daysInMonth = getDaysInMonth(displayDate.start)
        const label = i < 4 ? weeks[i] : daysInMonth === 28 ? '' : `29-${daysInMonth}`
        return {spacing: screenWidth / 20, barWidth: screenWidth / 9.5, label, ...baseData}
      default:
        return {spacing: screenWidth / 54, barWidth: screenWidth / 23, label: months[i], ...baseData}
    }
  })
}

const TransactionChart = ({items, mode, displayDate}) => {
  const [pressedItem, setPressedItem] = useState(null)
  const [data, setData] = useState(prepareChartData(items, displayDate))
  const frontColor = Colors[mode].barChartMain
  const frontColorSecondary = Colors[mode].barChartSecondary

  const handleItemPress = (item) => {
    if (pressedItem?.index === item.index) {
      setData(data.map(d => ({...d, frontColor})))
      setPressedItem(null)
    } else {
      setPressedItem(item)
      setData(data.map((d, i) => i === item.index ? {...d, frontColor} : {...d, frontColor: frontColorSecondary}))
    }
  }

  useEffect(() => {
    setData(prepareChartData(items, displayDate))
    setPressedItem(null)
  }, [items]);

  return (
      <Box className="w-full flex justify-center items-center">
        <BarChart
            frontColor={frontColor}
            height={120}
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
            // referenceLine1Position={average}
            // referenceLine1Config={{
            //   color: '#177AD5',
            //   dashWidth: 10,
            //   dashGap: 1,
            // }}
        />
      </Box>
  )
}

export default TransactionChart