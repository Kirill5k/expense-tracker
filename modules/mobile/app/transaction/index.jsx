import {router} from 'expo-router'
import {VStack} from '@/components/ui/vstack'
import {Box} from '@/components/ui/box'
import {ScreenLayout, ScreenHeader} from '@/components/common/layout'
import TransactionForm from '@/components/transaction/form'
import {useColorScheme} from '@/components/useColorScheme'
import {enhanceWithCategories} from '@/db/observers'
import {updateTransaction, createTransaction} from '@/db/operations'
import {useDatabase} from '@nozbe/watermelondb/react'
import useStore from '@/store'

const Transaction = ({user, categories}) => {
  const {txToUpdate, setTxToUpdate} = useStore()
  const database = useDatabase()
  const mode = useColorScheme()

  const incomeCategories = categories.filter(c => c.kind === 'income').map(c => c.toDomain)
  const expenseCategories = categories.filter(c => c.kind === 'expense').map(c => c.toDomain)

  const withUserId = obj => ({...obj, userId: user.id})

  const handleFormSubmit = (tx) => {
    const res = tx.id ? updateTransaction(database, withUserId(tx)) : createTransaction(database, withUserId(tx))
    return res.then(goBack)
  }

  const goBack = () => {
    setTxToUpdate(null)
    router.back()
  }

  return (
      <ScreenLayout>
        <VStack space="md">
          <ScreenHeader
              heading={txToUpdate?.id ? 'Edit Transaction' : 'New Transaction'}
              onBack={goBack}
          />
          <TransactionForm
              mode={mode}
              transaction={txToUpdate}
              currency={user?.currency}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              onCancel={goBack}
              onSubmit={handleFormSubmit}
          />
          <Box
              className="h-80"
          />
        </VStack>
      </ScreenLayout>
  )
}

export default enhanceWithCategories(Transaction)