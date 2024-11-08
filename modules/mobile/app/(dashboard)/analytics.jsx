import {useEffect, useState} from 'react'
import {Box} from '@/components/ui/box'
import {VStack} from '@/components/ui/vstack'
import {Divider} from '@/components/ui/divider'
import {Heading} from '@/components/ui/heading'
import {ScrollView} from '@/components/ui/scroll-view'
import {ProgressBar} from '@/components/common/progress'
import DatePeriodSelect from '@/components/common/date-period-select'
import ToggleButton from '@/components/common/toggle-button'
import TransactionChart from '@/components/transaction/chart'
import CategoryGroupedTransactionList from '@/components/analytics/list'
import Classes from '@/constants/classes'
import {useColorScheme} from '@/components/useColorScheme'
import {updateStateDisplayDate} from '@/db/operations'
import {mapTransactions} from '@/db/mappers'
import {enhanceWithCompleteState} from '@/db/observers'
import {useDatabase} from '@nozbe/watermelondb/react'

const kinds = [
  {label: 'Spending', value: 'expense'},
  {label: 'Income', value: 'income'}
]

const Analytics = ({state, user, displayedTransactions, categories, previousDisplayedTransactions}) => {
  const database = useDatabase()
  const mode = useColorScheme()

  const [isScrolling, setIsScrolling] = useState(false)
  const [loading, setLoading] = useState(false)
  const [kind, setKind] = useState(kinds[0])
  const [selectedTransactions, setSelectedTransactions] = useState([])

  const analysedTransactions = mapTransactions(displayedTransactions, categories, user).filter(tx => tx.category.kind === kind.value)
  const previousTransactions = mapTransactions(previousDisplayedTransactions, categories, user).filter(tx => tx.category.kind === kind.value)

  useEffect(() => {
    setSelectedTransactions([])
  }, [state.displayDateText])

  return (
      <VStack className={`${Classes.dashboardLayout}`}>
        <Heading size={isScrolling ? 'md' : '2xl'} className={loading ? 'pb-0' : 'pb-2'}>
          Analytics
        </Heading>
        {loading && <ProgressBar mode={mode}/>}
        <ToggleButton
            className="mb-2"
            size="lg"
            value={kind}
            items={kinds}
            onChange={setKind}
        />
        {isScrolling && <Divider/>}
        <ScrollView
            bounces={false}
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
              previousPeriodItems={previousTransactions}
              displayDate={state.displayDate}
              currency={user?.currency}
              onChartPress={setSelectedTransactions}
          />
          <DatePeriodSelect
              className="mt-3 mb-1"
              disabled={loading}
              mode={mode}
              value={state.displayDate}
              onSelect={(dd) => updateStateDisplayDate(database, dd)}
          />
          <CategoryGroupedTransactionList
              items={selectedTransactions.length === 0 ? analysedTransactions : selectedTransactions}
          />
          <Box
            className="mb-5"
          />
        </ScrollView>
      </VStack>
  )
}

export default enhanceWithCompleteState(Analytics)