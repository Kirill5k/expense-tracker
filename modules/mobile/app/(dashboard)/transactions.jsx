import React, {useState} from 'react'
import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {Divider} from '@/components/ui/divider'
import FloatingButton from '@/components/common/floating-button'
import Modal from '@/components/common/modal'
import DatePeriodSelect from '@/components/common/date-period-select'
import TransactionForm from '@/components/transaction/form'
import TransactionList from '@/components/transaction/list'
import {ProgressBar} from '@/components/common/progress'
import useStore from '@/store'
import Classes from '@/constants/classes'
import {mapTransactions} from '@/db/mappers'
import {updateStateDisplayDate, updateTransaction, createTransaction, hideTransaction} from '@/db/operations'
import {enhanceWithCompleteState} from '@/db/observers'
import {useDatabase} from '@nozbe/watermelondb/react'

const Transactions = ({state, user, displayedTransactions, categories}) => {
  const database = useDatabase()
  const {mode, setUndoAlert} = useStore()

  const [isScrolling, setIsScrolling] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [txToUpdate, setTxToUpdate] = useState(null)

  const incomeCategories = categories.filter(c => c.kind === 'income').map(c => c.toDomain)
  const expenseCategories = categories.filter(c => c.kind === 'expense').map(c => c.toDomain)
  const transactions = mapTransactions(displayedTransactions, categories, user)
  const withUserId = obj => ({...obj, userId: user.id})

  const handleFormSubmit = (tx) => {
    setTxToUpdate(null)
    setShowModal(false)
    setLoading(true)
    const res = tx.id ? updateTransaction(database, withUserId(tx)) : createTransaction(database, withUserId(tx))
    return res.then(() => setLoading(false))
  }

  const handleItemDelete = (tx) => {
    setLoading(true)
    hideTransaction(database, tx.id, true)
        .then(() => setUndoAlert('Transaction has been deleted', () => hideTransaction(database, tx.id, false)))
        .then(() => setLoading(false))
  }

  const handleItemCopy = (tx) => {
    setTxToUpdate({...tx, id: null})
    setShowModal(true)
  }

  /*
  TODO:
   - Filter and search transactions
   */

  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size={isScrolling ? 'sm' : '2xl'} className={loading ? 'pb-0' : 'pb-1'}>
          Transactions
        </Heading>
        {loading && <ProgressBar mode={mode}/>}
        <DatePeriodSelect
            className="mb-2 max-h-9"
            disabled={loading}
            mode={mode}
            value={state.displayDate}
            onSelect={dd => updateStateDisplayDate(database, dd)}
        />
        {isScrolling && <Divider/>}
        <TransactionList
            disabled={loading}
            items={transactions}
            onItemPress={tx => {
              setTxToUpdate(tx)
              setShowModal(true)
            }}
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
              setShowModal(true)
            }}
            mode={mode}
            iconCode={"plus"}
        />
        <Modal
            headerTitle={txToUpdate?.id ? 'Edit Transaction' : 'New Transaction'}
            isOpen={showModal}
            onClose={() => {
              setTxToUpdate(null)
              setShowModal(false)
            }}
        >
          <TransactionForm
              mode={mode}
              transaction={txToUpdate}
              currency={user?.currency}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              onCancel={() => {
                setTxToUpdate(null)
                setShowModal(false)
              }}
              onSubmit={handleFormSubmit}
          />
        </Modal>
      </VStack>
  )
}

export default enhanceWithCompleteState(Transactions)