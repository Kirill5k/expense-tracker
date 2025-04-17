import {useEffect} from 'react'
import {router} from 'expo-router'
import {VStack} from '@/components/ui/vstack'
import {ScreenLayout, ScreenHeader} from '@/components/common/layout'
import TransactionForm from '@/components/transaction/form'
import {useColorScheme} from '@/components/useColorScheme'
import {enhanceWithCategories} from '@/db/observers'
import {updateTransaction, saveTransactions} from '@/db/operations'
import {useDatabase} from '@nozbe/watermelondb/react'
import useStore from '@/store'

const Transaction = ({user, categories}) => {
  const {txToUpdate, setTxToUpdate, setErrorAlert} = useStore()
  const database = useDatabase()
  const mode = useColorScheme()

  const incomeCategories = categories.filter(c => c.kind === 'income').map(c => c.toDomain)
  const expenseCategories = categories.filter(c => c.kind === 'expense').map(c => c.toDomain)

  const withUserId = obj => ({...obj, userId: user.id})

  const handleFormSubmit = (txs) => {
    const isUpdate = txs.some(tx => tx.id)
    const res = isUpdate
        ? updateTransaction(database, withUserId(txs[0]))
        : saveTransactions(database, user.id, txs)
    return res.then(() => router.back()).catch((err) => setErrorAlert(err.message))
  }

  useEffect(() => {
    return () => setTxToUpdate(null)
  }, [])

  return (
      <ScreenLayout>
        <VStack space="md">
          <ScreenHeader
              heading={txToUpdate?.id ? 'Edit Transaction' : 'New Transaction'}
          />
          <TransactionForm
              flat
              mode={mode}
              transaction={txToUpdate}
              currency={user?.currency}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              onCancel={() => router.back()}
              onSubmit={handleFormSubmit}
          />
        </VStack>
      </ScreenLayout>
  )
}

export default enhanceWithCategories(Transaction)