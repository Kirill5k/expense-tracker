import {useState} from 'react'
import {VStack} from '@/components/ui/vstack'
import {Divider} from '@/components/ui/divider'
import {Heading} from '@/components/ui/heading'
import {ScrollView} from '@/components/ui/scroll-view'
import {ProgressBar} from '@/components/common/progress'
import DatePeriodSelect from '@/components/common/date-period-select'
import TransactionChart from '@/components/transaction/chart'
import Classes from '@/constants/classes'
import useStore from '@/store'
import {Dimensions} from 'react-native'

const Analytics = () => {
  const screenWidth = Dimensions.get('window').width
  const chartWidth = screenWidth - 92
  const [isScrolling, setIsScrolling] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    mode,
    displayDate,
    setDisplayDate,
    user,
    displayedTransactions
  } = useStore()

  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size={isScrolling ? 'sm' : '2xl'} className={loading ? 'pb-0' : 'pb-2'}>
          Analytics
        </Heading>
        {loading && <ProgressBar mode={mode}/>}
        <TransactionChart
            mode={mode}
            items={displayedTransactions}
            displayDate={displayDate}
            currency={user?.settings?.currency}
            chartWidth={chartWidth}
        />
        <DatePeriodSelect
            className="mt-2"
            disabled={loading}
            mode={mode}
            value={displayDate}
            onSelect={setDisplayDate}
        />
        {isScrolling && <Divider/>}
        <ScrollView
            showsVerticalScrollIndicator={false}
            onScroll={({nativeEvent}) => {
              if (nativeEvent.contentOffset.y <= 20 && isScrolling) {
                setIsScrolling(false)
              } else if (nativeEvent.contentOffset.y > 20 && !isScrolling) {
                setIsScrolling(true)
              }
            }}
        >
        </ScrollView>
      </VStack>
  )
}

export default Analytics