import {useEffect, useState, useMemo} from 'react'
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
import {lightImpact} from '@/utils/haptics'


const Analytics = ({state, user, displayedTransactions, categories, previousDisplayedTransactions}) => {
  const database = useDatabase()
  const mode = useColorScheme()

  const [kind, setKind] = useState(categoryOptions[0].value)
  const [selectedTransactions, setSelectedTransactions] = useState([])

  const analysedTransactions = useMemo(
      () => mapTransactions(displayedTransactions, categories, user).filter(tx => tx.category.kind === kind),
      [displayedTransactions, kind]
  )
  const previousTransactions = useMemo(
      () => mapTransactions(previousDisplayedTransactions, categories, user).filter(tx => tx.category.kind === kind),
      [previousDisplayedTransactions, kind]
  )

  useEffect(() => {
    setSelectedTransactions([])
  }, [state.displayDateText])

  const handleDatePeriodChange = (datePeriod) => {
    lightImpact()
    updateStateDisplayDate(database, datePeriod)
  }

  return (
      <VStack className={`${Classes.dashboardLayout}`}>
        <VStack space="md">
          <ScreenHeading heading="Analytics"/>
          <ToggleButton
              size="lg"
              value={kind}
              items={categoryOptions}
              onChange={setKind}
          />
          <TransactionChart
              kind={kind}
              mode={mode}
              items={analysedTransactions}
              previousPeriodItems={previousTransactions}
              displayDate={state.displayDate}
              currency={user?.currency}
              onChartPress={setSelectedTransactions}
          />
        </VStack>
        <DatePeriodSelect
            className="mb-1"
            mode={mode}
            value={state.displayDate}
            onSelect={handleDatePeriodChange}
        />
        <ScrollView
            bounces={true}
            showsVerticalScrollIndicator={false}
        >
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