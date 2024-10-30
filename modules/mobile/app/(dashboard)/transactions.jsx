import React, {useState} from 'react'
import {router} from 'expo-router'
import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {Divider} from '@/components/ui/divider'
import FloatingButton from '@/components/common/floating-button'
import DatePeriodSelect from '@/components/common/date-period-select'
import TransactionList from '@/components/transaction/list'
import {ProgressBar} from '@/components/common/progress'
import useStore from '@/store'
import Classes from '@/constants/classes'
import {useColorScheme} from '@/components/useColorScheme'
import {mapTransactions} from '@/db/mappers'
import {updateStateDisplayDate, hideTransaction} from '@/db/operations'
import {enhanceWithCompleteState} from '@/db/observers'
import {useDatabase} from '@nozbe/watermelondb/react'

const Transactions = ({state, user, displayedTransactions, categories}) => {
  const database = useDatabase()
  const {setUndoAlert, setTxToUpdate} = useStore()
  const mode = useColorScheme()

  const [isScrolling, setIsScrolling] = useState(false)
  const [loading, setLoading] = useState(false)

  const transactions = mapTransactions(displayedTransactions, categories, user)

  const handleItemDelete = (tx) => {
    setLoading(true)
    hideTransaction(database, tx.id, true)
        .then(() => setUndoAlert('Transaction has been deleted', () => hideTransaction(database, tx.id, false)))
        .then(() => setLoading(false))
  }

  const handleItemCopy = (tx) => {
    setTxToUpdate({...tx, id: null})
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
        <Heading size={isScrolling ? 'md' : '3xl'} className={loading ? 'pb-0' : 'pb-1'}>
          Transactions
        </Heading>
        {loading && <ProgressBar mode={mode}/>}
        <DatePeriodSelect
            disabled={loading}
            mode={mode}
            value={state.displayDate}
            onSelect={dd => updateStateDisplayDate(database, dd)}
        />
        {isScrolling && <Divider/>}
        <TransactionList
            disabled={loading}
            items={transactions}
            onItemPress={handleItemPress}
            onItemCopy={handleItemCopy}
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