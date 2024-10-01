import {useState} from 'react'
import {VStack} from '@/components/ui/vstack'
import {Fab, FabIcon} from '@/components/ui/fab'
import {MaterialIcon} from '@/components/ui/icon'
import Colors from '@/constants/colors'
import TransactionBarChart from './bar-chart'
import TransactionPieChart from './pie-chart'
import {Dimensions} from "react-native";


const TransactionChart = ({items, mode, displayDate, currency}) => {
  const screenWidth = Dimensions.get('window').width
  const chartWidth = screenWidth - 92

  const [showPieChart, setShowPieChart] = useState(true)

  return (
      <VStack>
        <Fab
            isHovered={false}
            placement="top right"
            size="md"
            className="shadow-none rounded-full p-1.5 top-1 bg-primary border border-primary-50"
            variant="outline" onPress={() => setShowPieChart(!showPieChart)}
        >
          <FabIcon as={MaterialIcon} code={showPieChart ? 'chart-bar' : 'chart-pie'} dsize={22} dcolor={Colors[mode].text} />
        </Fab>
        {!showPieChart && (
            <TransactionBarChart
                items={items}
                displayDate={displayDate}
                currency={currency}
                mode={mode}
                chartWidth={chartWidth}
            />
        )}
        {showPieChart && (
            <TransactionPieChart
                items={items}
                currency={currency}
                mode={mode}
                chartWidth={chartWidth}
            />
        )}
      </VStack>
  )
}

export default TransactionChart