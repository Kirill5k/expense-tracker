import {useEffect, useState} from 'react'
import {router} from 'expo-router'
import {Box} from '@/components/ui/box'
import {VStack} from '@/components/ui/vstack'
import {ScreenHeading} from '@/components/common/layout'
import {ScrollView} from '@/components/ui/scroll-view'
import DatePeriodSelect from '@/components/common/date-period-select'
import ToggleButton from '@/components/common/toggle-button'
import TransactionChart from '@/components/transaction/chart'
import CategoryGroupedTransactionList from '@/components/analytics/list'
import FloatingButton from '@/components/common/floating-button'
import Classes from '@/constants/classes'
import {categoryOptions} from '@/constants/categories'
import {useColorScheme} from '@/components/useColorScheme'
import {updateStateDisplayDate} from '@/db/operations'
import {mapTransactions} from '@/db/mappers'
import {enhanceWithCompleteState} from '@/db/observers'
import {useDatabase} from '@nozbe/watermelondb/react'

const Analytics = ({state, user, displayedTransactions, categories, previousDisplayedTransactions}) => {
  const database = useDatabase()
  const mode = useColorScheme()

  const [loading, setLoading] = useState(false)
  const [kind, setKind] = useState(categoryOptions[0].value)
  const [selectedTransactions, setSelectedTransactions] = useState([])

  const analysedTransactions = mapTransactions(displayedTransactions, categories, user).filter(tx => tx.category.kind === kind)
  const previousTransactions = mapTransactions(previousDisplayedTransactions, categories, user).filter(tx => tx.category.kind === kind)

  useEffect(() => {
    setSelectedTransactions([])
  }, [state.displayDateText])

  return (
      <VStack className={`${Classes.dashboardLayout}`}>
        <ScreenHeading
            heading="Analytics"
            loading={loading}
        />
        <ToggleButton
            className="mb-2"
            size="lg"
            value={kind}
            items={categoryOptions}
            onChange={setKind}
        />
        <ScrollView
            bounces={true}
            showsVerticalScrollIndicator={false}
        >
          <TransactionChart
              kind={kind}
              mode={mode}
              items={analysedTransactions}
              previousPeriodItems={previousTransactions}
              displayDate={state.displayDate}
              currency={user?.currency}
              onChartPress={setSelectedTransactions}
          />
          <DatePeriodSelect
              className="mb-2 mt-4"
              disabled={loading}
              mode={mode}
              value={state.displayDate}
              onSelect={(dd) => updateStateDisplayDate(database, dd)}
          />
          <CategoryGroupedTransactionList
              mode={mode}
              items={selectedTransactions.length === 0 ? analysedTransactions : selectedTransactions}
          />
          <Box className="py-5 my-0.5"></Box>
        </ScrollView>
        <FloatingButton
          mode={mode}
          buttons={[
            {icon: 'bank-transfer', text: 'Transaction', onPress: () => router.push('transaction')},
            {icon: 'calendar-sync-outline', text: 'Recurring', onPress: () => router.push('recurring')},
            {icon: 'shape', text: 'Category', onPress: () => router.push('category')},
          ]}
        />
      </VStack>
  )
}

export default enhanceWithCompleteState(Analytics)