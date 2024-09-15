import React, {useState} from 'react'
import {VStack} from "@/components/ui/vstack";
import {Heading} from "@/components/ui/heading";
import {Divider} from "@/components/ui/divider";
import {ScrollView} from "@/components/ui/scroll-view";
import FloatingButton from '@/components/common/floating-button'
import Modal from '@/components/common/modal'
import DatePeriodSelect from '@/components/common/date-period-select'
import TransactionForm from '@/components/transaction/form'
import TransactionList from '@/components/transaction/list'
import useStore from '@/store'

export const Transactions = () => {
  const [loading, setLoading] = useState(false)
  const [headerSize, setHeaderSize] = useState("2xl")
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
  } = useStore()

  const handleFormSubmit = (tx) => {
    setTxToUpdate(null)
    setShowModal(false)
    setLoading(true)
    const res = tx.id ? updateTransaction(tx) : createTransaction(tx)
    return res.then(() => setLoading(false))
  }

  /*
  TODO:
   - Add loader/spinner
   - Sort and Filter transactions
   */

  return (
      <VStack
          className="px-4 pt-2 pb-0 md:px-10 md:pt-6 md:pb-0 h-full w-full max-w-[1500px] self-center bg-background-0"
      >
        <Heading size={headerSize} className="font-roboto">
          Transactions
        </Heading>
        <DatePeriodSelect
            disabled={loading}
            mode={mode}
            value={displayDate}
            onSelect={setDisplayDate}
        />
        <Divider/>
        <ScrollView
            className="max-w-[600px] flex-1"
            showsVerticalScrollIndicator={false}
            onScroll={({nativeEvent}) => {
              if (nativeEvent.contentOffset.y <= 40) {
                setHeaderSize('2xl')
              } else {
                setHeaderSize('sm')
              }
            }}
        >
          <TransactionList
              disabled={loading}
              items={displayedTransactions}
              onItemPress={tx => {
                setTxToUpdate(tx)
                setShowModal(true)
              }}
          />
        </ScrollView>
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
