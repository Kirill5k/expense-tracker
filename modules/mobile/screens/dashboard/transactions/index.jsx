import React, {useState} from 'react'
import {VStack} from '@/components/ui/vstack'
import {Box} from '@/components/ui/box'
import {Heading} from '@/components/ui/heading'
import {Divider} from '@/components/ui/divider'
import {ScrollView} from '@/components/ui/scroll-view'
import FloatingButton from '@/components/common/floating-button'
import Modal from '@/components/common/modal'
import DatePeriodSelect from '@/components/common/date-period-select'
import TransactionForm from '@/components/transaction/form'
import TransactionList from '@/components/transaction/list'
import useStore from '@/store'
import * as Progress from 'react-native-progress'
import Colors from '@/constants/colors'
import Classes from '@/constants/classes'

export const Transactions = () => {
  const [loading, setLoading] = useState(false)
  const [headerSize, setHeaderSize] = useState('2xl')
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
   - Filter and search transactions
   */

  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size={headerSize} className="font-roboto">
          Transactions
        </Heading>
        <DatePeriodSelect
            disabled={loading}
            mode={mode}
            value={displayDate}
            onSelect={setDisplayDate}
        />
        <TransactionList
            disabled={loading}
            items={displayedTransactions}
            onItemPress={tx => {
              setTxToUpdate(tx)
              setShowModal(true)
            }}
            onItemCopy={tx => {
              console.log('copy', tx)
            }}
            onItemDelete={tx => {
              console.log('delete', tx)
            }}
            onScroll={({nativeEvent}) => {
              if (nativeEvent.contentOffset.y <= 20) {
                setHeaderSize('2xl')
              } else {
                setHeaderSize('sm')
              }
            }}
        >
          <Box>
            {headerSize === 'sm' && <Divider/>}
            {loading && <Progress.Bar
                height={3}
                animationType="decay"
                borderRadius={0}
                borderWidth={0}
                indeterminateAnimationDuration={250}
                width={null}
                indeterminate={true}
                color={Colors[mode].tint}
                borderColor={Colors[mode].tint}
            />}
          </Box>
        </TransactionList>
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
