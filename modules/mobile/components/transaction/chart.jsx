import {useState} from 'react'
import {Dimensions} from 'react-native'
import {VStack} from '@/components/ui/vstack'
import {Fab, FabIcon} from '@/components/ui/fab'
import {MaterialIcon} from '@/components/ui/icon'
import Colors from '@/constants/colors'
import TransactionBarChart from './bar-chart'
import TransactionPieChart from './pie-chart'


const TransactionChart = ({items, mode, displayDate, currency, kind, onChartPress}) => {
  const screenWidth = Dimensions.get('window').width
  const chartWidth = screenWidth - 92
  const [showPieChart, setShowPieChart] = useState(false)
  const kindLabel = kind === 'expense' ? 'Spent' : 'Received'

  return (
      <VStack className="h-56">
        <Fab
            isHovered={false}
            placement="top right"
            size="md"
            className="shadow-none rounded-full p-1.5 top-1 bg-background-100"
            variant="outline" onPress={() => setShowPieChart(!showPieChart)}
        >
          <FabIcon as={MaterialIcon} code={showPieChart ? 'chart-bar' : 'chart-arc'} dsize={22} dcolor={Colors[mode].text} />
        </Fab>
        {!showPieChart && (
            <TransactionBarChart
                kindLabel={kindLabel}
                items={items}
                displayDate={displayDate}
                currency={currency}
                mode={mode}
                chartWidth={chartWidth}
                onChartPress={onChartPress}
            />
        )}
        {showPieChart && (
            <TransactionPieChart
                kindLabel={kindLabel}
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