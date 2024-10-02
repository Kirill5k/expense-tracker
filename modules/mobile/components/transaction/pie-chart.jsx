import {VStack} from '@/components/ui/vstack'
import {Text} from '@/components/ui/text'
import {Heading} from '@/components/ui/heading'
import {Box} from '@/components/ui/box'
import {useEffect, useState} from 'react'
import {PieChart} from 'react-native-gifted-charts'
import Colors from '@/constants/colors'

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

  const data = Object.values(transactionsByCategory).map((group, i) => ({
    index: i,
    transactions: group.transactions,
    color: group.category.color,
    value: group.totalAmount,
    category: group.category,
  })).sort((a, b) => a.category.name.localeCompare(b.category.name))

  return {data, total}
}

const TransactionPieChart = ({items, mode, currency, kindLabel, onChartPress}) => {
  const [pressedItem, setPressedItem] = useState(null)
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [chartData, setChartData] = useState({})

  const handlePress = (item) => {
    if (pressedItem?.index === item.index || !item.category) {
      setData(chartData.data)
      setTotal(chartData.total)
      setPressedItem(null)
      onChartPress([])
    } else {
      setPressedItem(item)
      setData(data.map((d, i) => i === item.index ? {...d, focused: true} : {...d, focused: false}))
      setTotal(item.value)
      onChartPress(item.transactions)
    }
  }

  useEffect(() => {
    const chartData = prepareChartData(items, mode)
    setData(chartData.data)
    setTotal(chartData.total)
    setChartData(chartData)
    setPressedItem(null)
  }, [items]);

  return (
      <Box className="w-full flex items-center justify-center my-1">
        <PieChart
            sectionAutoFocus
            onPress={handlePress}
            data={data}
            donut
            radius={90}
            innerRadius={60}
            innerCircleColor={Colors[mode].background}
            strokeColor={Colors[mode].background}
            strokeWidth={1}
            centerLabelComponent={() => (
                <VStack className="items-center justify-center">
                  <Text size="xs">{kindLabel}</Text>
                  <Heading size="xl">
                    {currency?.symbol}{total >= 10000 ? total.toFixed(0) : total.toFixed(2)}
                  </Heading>
                </VStack>
            )}
        />
      </Box>
  )
}

export default TransactionPieChart