import React, {useState} from 'react'
import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import Classes from '@/constants/classes'
import ToggleButton from '@/components/common/toggle-button'
import {ProgressBar} from '@/components/common/progress'
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
  const mode = useColorScheme() || 'light'

  const {setUndoAlert, setRtxToUpdate} = useStore()
  const [kind, setKind] = useState('all')
  const [isScrolling, setIsScrolling] = useState(false)
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

  const transactions = mapTransactions(recurringTransactions, categories, user)
  const displayedTxs = kind === 'all' ? transactions : transactions.filter(tx => tx.category.kind === kind)

  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size={isScrolling ? 'md' : '2xl'} className={loading ? 'pb-0' : 'pb-2'}>
          Recurring
        </Heading>
        {loading && <ProgressBar mode={mode}/>}
        <ToggleButton
            className="mb-2"
            size="lg"
            value={kind}
            items={[{label: 'All', value: 'all'}, ...categoryOptions]}
            onChange={setKind}
        />
        <RecurringTransactionList
            items={displayedTxs}
            disabled={loading}
            onItemPress={handleItemPress}
            onItemDelete={handleItemDelete}
            onScroll={({nativeEvent}) => {
              if (nativeEvent.contentOffset.y <= 20 && isScrolling) {
                setIsScrolling(false)
              } else if (nativeEvent.contentOffset.y > 20 && !isScrolling) {
                setIsScrolling(true)
              }
            }}
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
