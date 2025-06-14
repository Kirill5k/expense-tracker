import React, {useState, useMemo} from 'react'
import {VStack} from '@/components/ui/vstack'
import Classes from '@/constants/classes'
import {ScreenHeading} from '@/components/common/layout'
import ToggleButton from '@/components/common/toggle-button'
import FloatingButton from '@/components/common/floating-button'
import RecurringTransactionList from '@/components/recurring/list'
import {useColorScheme} from '@/components/useColorScheme'
import {categoryOptions} from '@/constants/categories'
import {enhanceWithRecurringTransactions} from '@/db/observers'
import {hideRecurringTransaction} from '@/db/operations'
import {mapTransactions} from '@/db/mappers'
import useStore from '@/store'
import {router} from 'expo-router'
import {useDatabase} from '@nozbe/watermelondb/react'


const Recurring = ({user, categories, recurringTransactions}) => {
  const database = useDatabase()
  const mode = useColorScheme()

  const {setUndoAlert, setRtxToUpdate} = useStore()
  const [kind, setKind] = useState('all')
  const [loading, setLoading] = useState(false)

  const handleItemDelete = (rtx) => {
    setLoading(true)
    hideRecurringTransaction(database, rtx.id, true)
        .then(() => setUndoAlert('Recurring transaction has been deleted', () => hideRecurringTransaction(database, rtx.id, false)))
        .then(() => setLoading(false))
  }

  const handleItemPress = (rtx) => {
    setRtxToUpdate(rtx)
    router.push('recurring')
  }

  const transactions = useMemo(
      () => mapTransactions(recurringTransactions, categories, user),
      [recurringTransactions, categories, user]
  )
  const displayedTxs = useMemo(
      () => kind === 'all' ? transactions : transactions.filter(tx => tx.category.kind === kind),
      [transactions, kind]
  )

  return (
      <VStack className={Classes.dashboardLayout} space="md">
        <ScreenHeading
            heading="Recurring"
            loading={loading}
        />
        <ToggleButton
            size="lg"
            value={kind}
            items={[{label: 'All', value: 'all'}, ...categoryOptions]}
            onChange={setKind}
            className="mb-2"
        />
        <RecurringTransactionList
            items={displayedTxs}
            disabled={loading}
            onItemPress={handleItemPress}
            onItemDelete={handleItemDelete}
        />
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

export default enhanceWithRecurringTransactions(Recurring)
