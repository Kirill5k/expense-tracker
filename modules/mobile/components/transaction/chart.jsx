import {useState} from 'react'
import {VStack} from '@/components/ui/vstack'
import {Fab, FabIcon} from '@/components/ui/fab'
import {MaterialIcon} from '@/components/ui/icon'
import Colors from '@/constants/colors'
import TransactionBarChart from './bar-chart'


const TransactionChart = ({items, mode, displayDate, currency, chartWidth}) => {
  const [showPieChart, setShowPieChart] = useState(false)

  return (
      <VStack>
        <Fab
            isHovered={false}
            placement="top right"
            size="md"
            className="rounded-full p-1 top-1 bg-background-0 border border-outline-500"
            variant="outline" onPress={() => setShowPieChart(true)}
        >
          <FabIcon as={MaterialIcon} code="chart-donut" dsize={26} dcolor={Colors[mode].text} />
        </Fab>
        <TransactionBarChart
          items={items}
          displayDate={displayDate}
          currency={currency}
          mode={mode}
        />
      </VStack>
  )
}

export default TransactionChart