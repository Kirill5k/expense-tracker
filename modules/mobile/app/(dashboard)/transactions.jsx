import React, {useState} from 'react'
import {router} from 'expo-router'
import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {ScreenHeading} from '@/components/common/layout'
import DatePeriodSelect from '@/components/common/date-period-select'
import TransactionList from '@/components/transaction/list'
import TransactionFilter from '@/components/transaction/filter'
import SearchInput from '@/components/common/search-input'
import FloatingButton from '@/components/common/floating-button'
import Classes from '@/constants/classes'
import {useColorScheme} from '@/components/useColorScheme'
import {mapTransactions} from '@/db/mappers'
import {updateStateDisplayDate, hideTransaction} from '@/db/operations'
import {enhanceWithCompleteState} from '@/db/observers'
import {useDatabase} from '@nozbe/watermelondb/react'
import useStore from '@/store'
import {filterBySearchQuery, filterByCategory} from '@/utils/transactions'
import {lightImpact} from '@/utils/haptics'


const Transactions = ({state, user, displayedTransactions, categories}) => {
  const database = useDatabase()
  const {setUndoAlert, setTxToUpdate} = useStore()
  const mode = useColorScheme()

  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCats, setFilteredCats] = useState([])

  const mappedTransactions = mapTransactions(displayedTransactions, categories, user)
  const transactions = filterByCategory(filterBySearchQuery(mappedTransactions, searchQuery), filteredCats)

  const handleItemDelete = (tx) => {
    hideTransaction(database, tx.id, true)
        .then(() => setUndoAlert('Transaction has been deleted', () => hideTransaction(database, tx.id, false)))
  }

  const handleItemCopy = (tx) => {
    setTxToUpdate({...tx, id: null, isRecurring: false, parentTransactionId: null})
    router.push('transaction')
  }

  const handleItemPress = (tx) => {
    setTxToUpdate(tx)
    router.push('transaction')
  }

  const handleDatePeriodChange = (datePeriod) => {
    lightImpact()
    updateStateDisplayDate(database, datePeriod)
  }

  return (
      <VStack className={Classes.dashboardLayout} space="md">
        <HStack className="relative">
          <ScreenHeading
            heading="Transactions"
          />
          <SearchInput
              mode={mode}
              className="absolute ml-auto z-10 bg-background-0 right-14 -top-1"
              onChange={setSearchQuery}
          />
          <TransactionFilter
              className="absolute mx-1 right-0 -top-1"
              mode={mode}
              categories={categories}
              value={{
                categories: filteredCats
              }}
              onChange={({categories}) => {
                setFilteredCats(categories)
              }}
          />
        </HStack>
        <DatePeriodSelect
            mode={mode}
            value={state.displayDate}
            onSelect={handleDatePeriodChange}
        />
        <TransactionList
            mode={mode}
            items={transactions}
            onItemPress={handleItemPress}
            onItemCopy={handleItemCopy}
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

export default enhanceWithCompleteState(Transactions)