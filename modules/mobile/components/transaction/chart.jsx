import {Box} from '@/components/ui/box'
import {Dimensions} from 'react-native'
import {getDaysInMonth} from 'date-fns'
import {BarChart, yAxisSides} from 'react-native-gifted-charts'
import Colors from '@/constants/colors'

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const weeks = ['1-7', '8-14', '15-21', '22-28']
const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

const colors = {frontColor: '#009FFF', sideColor: '#009FFF', topColor: '#009FFF'}

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

const totalByDateRange = (txs, range) => {
  return txs.reduce((acc, tx) => {
    const bucketNumber = getBucketNumberForDateRange(tx, range)
    acc[bucketNumber].totalAmount += tx.amount.value
    acc[bucketNumber].transactions.push(tx)
    return acc
  }, new Array(getNumberOfBucketsForDateRange(range)).fill(null).map(() => ({transactions: [], totalAmount: 0.0})))
}

const TransactionChart = ({items, mode, displayDate}) => {
  const screenWidth = Dimensions.get('window').width

  let total = 0
  const data = totalByDateRange(items, displayDate.range).map((group, i) => {
    total += group.totalAmount
    const baseData = {value: group.totalAmount, transactions: group.transactions, ...colors}
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

  const average = Math.floor(total / data.length)

  return (
      <Box className="w-full flex justify-center items-center">
        <BarChart
            frontColor={'#009FFF'}
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
            onPress={(item, i) => console.log('pressing on', item, i)}
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