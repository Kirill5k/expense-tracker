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

const Transactions = () => {
  const [isScrolling, setIsScrolling] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [txToUpdate, setTxToUpdate] = useState(null)

  const {
    mode,
    user,
    displayedTransactions,
    incomeCategories,
    expenseCategories,
    displayDate,
    setDisplayDate,
    createTransaction,
    updateTransaction,
    hideTransaction
  } = useStore()

  const handleFormSubmit = (tx) => {
    setTxToUpdate(null)
    setShowModal(false)
    setLoading(true)
    const res = tx.id ? updateTransaction(tx) : createTransaction(tx)
    return res.then(() => setLoading(false))
  }

  const handleItemDelete = (tx) => {
    const setHidden = (hidden, undoAction) => {
      setLoading(true)
      hideTransaction(tx.id, hidden, undoAction).then(() => setLoading(false))
    }

    setHidden(true, () => setHidden(false, null))
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
        <Heading size={isScrolling ? 'sm' : '2xl'} className={loading ? 'pb-0' : 'pb-2'}>
          Transactions
        </Heading>
        {loading && <ProgressBar mode={mode}/>}
        <DatePeriodSelect
            disabled={loading}
            mode={mode}
            value={displayDate}
            onSelect={setDisplayDate}
        />
        {isScrolling && <Divider/>}
        <TransactionList
            disabled={loading}
            items={displayedTransactions}
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
              currency={user?.settings?.currency}
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

export default Transactions