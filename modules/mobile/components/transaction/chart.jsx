import {useState} from 'react'
import {Dimensions} from 'react-native'
import {VStack} from '@/components/ui/vstack'
import {Fab, FabIcon} from '@/components/ui/fab'
import {MaterialIcon} from '@/components/ui/icon'
import Colors from '@/constants/colors'
import TransactionBarChart from './bar-chart'
import TransactionPieChart from './pie-chart'


const TransactionChart = ({items, previousPeriodItems, mode, displayDate, currency, kind, onChartPress}) => {
  const screenWidth = Dimensions.get('window').width
  const chartWidth = screenWidth - 92
  const [showPieChart, setShowPieChart] = useState(false)

  const handleFabPress = () => {
    setShowPieChart(!showPieChart)
    onChartPress([])
  }

  return (
      <VStack className="h-64">
        <Fab
            isHovered={false}
            placement="top right"
            size="lg"
            className="shadow-none rounded-full p-1.5 top-5 bg-background-100"
            variant="outline"
            onPress={handleFabPress}
        >
          <FabIcon as={MaterialIcon} code={showPieChart ? 'chart-bar' : 'chart-arc'} dsize={28} dcolor={Colors[mode].text} />
        </Fab>
        {!showPieChart && (
            <TransactionBarChart
                kind={kind}
                items={items}
                previousPeriodItems={previousPeriodItems}
                displayDate={displayDate}
                currency={currency}
                mode={mode}
                chartWidth={chartWidth}
                onChartPress={onChartPress}
            />
        )}
        {showPieChart && (
            <TransactionPieChart
                kind={kind}
                items={items}
                currency={currency}
                mode={mode}
                chartWidth={chartWidth}
                onChartPress={onChartPress}
            />
        )}
      </VStack>
  )
}

export default TransactionChart