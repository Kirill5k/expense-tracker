import {useEffect} from 'react'
import {router} from 'expo-router'
import RecurringTransactionForm from '@/components/recurring/form'
import {ScreenLayout, ScreenHeader} from '@/components/common/layout'
import {createRecurringTransaction, updateRecurringTransaction} from '@/db/operations'
import {enhanceWithCategories} from '@/db/observers'
import {useColorScheme} from '@/components/useColorScheme'
import {useDatabase} from '@nozbe/watermelondb/react'
import useStore from '@/store'

const Recurring = ({user, categories}) => {
  const {rtxToUpdate, setRtxToUpdate, setErrorAlert} = useStore()
  const database = useDatabase()
  const mode = useColorScheme()

  const incomeCategories = categories.filter(c => c.kind === 'income').map(c => c.toDomain)
  const expenseCategories = categories.filter(c => c.kind === 'expense').map(c => c.toDomain)

  const withUserId = obj => ({...obj, userId: user.id})

  const handleFormSubmit = (rtx) => {
    const res = rtx.id
        ? updateRecurringTransaction(database, withUserId(rtx))
        : createRecurringTransaction(database, withUserId(rtx))
    return res.then(() => router.back()).catch((err) => setErrorAlert(err.message))
  }

  useEffect(() => {
    return () => setRtxToUpdate(null)
  }, [])

  return (
      <ScreenLayout>
        <ScreenHeader
            heading={rtxToUpdate?.id ? 'Edit Recurring Transaction' : 'New Recurring Transaction'}
        />
        <RecurringTransactionForm
            flat
            mode={mode}
            transaction={rtxToUpdate}
            currency={user?.currency}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            onCancel={() => router.back()}
            onSubmit={handleFormSubmit}
        />
      </ScreenLayout>
  )
}

export default enhanceWithCategories(Recurring)