import React, {useState} from 'react'
import {router} from 'expo-router'
import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {Heading} from '@/components/ui/heading'
import FloatingButton from '@/components/common/floating-button'
import DatePeriodSelect from '@/components/common/date-period-select'
import TransactionList from '@/components/transaction/list'
import {ProgressBar} from '@/components/common/progress'
import SearchInput from '@/components/common/search-input'
import Classes from '@/constants/classes'
import {useColorScheme} from '@/components/useColorScheme'
import {mapTransactions} from '@/db/mappers'
import {updateStateDisplayDate, hideTransaction} from '@/db/operations'
import {enhanceWithCompleteState} from '@/db/observers'
import {useDatabase} from '@nozbe/watermelondb/react'
import useStore from '@/store'
import {filterBySearchQuery} from '@/utils/transactions'


const Transactions = ({state, user, displayedTransactions, categories}) => {
  const database = useDatabase()
  const {setUndoAlert, setTxToUpdate} = useStore()
  const mode = useColorScheme()

  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const transactions = filterBySearchQuery(mapTransactions(displayedTransactions, categories, user), searchQuery)

  const handleItemDelete = (tx) => {
    setLoading(true)
    hideTransaction(database, tx.id, true)
        .then(() => setUndoAlert('Transaction has been deleted', () => hideTransaction(database, tx.id, false)))
        .then(() => setLoading(false))
  }

  const handleItemCopy = (tx) => {
    setTxToUpdate({...tx, id: null, isRecurring: false, parentTransactionId: null})
    router.push('transaction')
  }

  const handleItemPress = (tx) => {
    setTxToUpdate(tx)
    router.push('transaction')
  }

  /*
  TODO:
   - Filter and search transactions
   */

  return (
      <VStack className={Classes.dashboardLayout}>
        <HStack className="relative">
          <Heading size="2xl" className={loading ? 'pb-0' : 'pb-1'}>
            Transactions
          </Heading>
          <SearchInput
              mode={mode}
              className="ml-auto z-10 bg-background-0"
              onChange={setSearchQuery}
          />
        </HStack>
        {loading && <ProgressBar mode={mode}/>}
        <DatePeriodSelect
            disabled={loading}
            mode={mode}
            value={state.displayDate}
            onSelect={dd => updateStateDisplayDate(database, dd)}
        />
        <TransactionList
            mode={mode}
            disabled={loading}
            items={transactions}
            onItemPress={handleItemPress}
            onItemCopy={handleItemCopy}
            onItemDelete={handleItemDelete}
        />
        <FloatingButton
            onPress={() => {
              setTxToUpdate(null)
              router.push('transaction')
            }}
            mode={mode}
            iconCode={"plus"}
        />
      </VStack>
  )
}

export default enhanceWithCompleteState(Transactions)