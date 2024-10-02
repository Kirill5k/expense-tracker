import {useEffect, useState} from 'react'
import {VStack} from '@/components/ui/vstack'
import {Divider} from '@/components/ui/divider'
import {Heading} from '@/components/ui/heading'
import {ScrollView} from '@/components/ui/scroll-view'
import {ProgressBar} from '@/components/common/progress'
import DatePeriodSelect from '@/components/common/date-period-select'
import ToggleButton from '@/components/common/toggle-button'
import TransactionChart from '@/components/transaction/chart'
import Classes from '@/constants/classes'
import useStore from '@/store'

const kinds = [{label: 'Spending', value: 'expense'}, {label: 'Income', value: 'income'}]

const Analytics = () => {
  const {
    mode,
    displayDate,
    setDisplayDate,
    user,
    displayedTransactions
  } = useStore()

  const [isScrolling, setIsScrolling] = useState(false)
  const [loading, setLoading] = useState(false)
  const [kind, setKind] = useState(kinds[0])
  const [selectedTransactions, setSelectedTransactions] = useState([])

  const analysedTransactions = displayedTransactions.filter(tx => tx.category.kind === kind.value)

  useEffect(() => {
    setSelectedTransactions(analysedTransactions)
  }, [displayDate.text])

  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size={isScrolling ? 'sm' : '2xl'} className={loading ? 'pb-0' : 'pb-2'}>
          Analytics
        </Heading>
        {loading && <ProgressBar mode={mode}/>}
        <ToggleButton
            className="mb-2"
            size="md"
            value={kind}
            items={kinds}
            onChange={setKind}
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
          <TransactionChart
              kind={kind.value}
              mode={mode}
              items={analysedTransactions}
              displayDate={displayDate}
              currency={user?.settings?.currency}
              onChartPress={setSelectedTransactions}
          />
          <DatePeriodSelect
              className="mt-2"
              disabled={loading}
              mode={mode}
              value={displayDate}
              onSelect={setDisplayDate}
          />
        </ScrollView>
      </VStack>
  )
}

export default Analytics