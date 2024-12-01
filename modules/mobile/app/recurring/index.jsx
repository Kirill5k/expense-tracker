import {useEffect} from 'react'
import {router} from 'expo-router'
import {VStack} from '@/components/ui/vstack'
import CategoryForm from '@/components/category/form'
import {ScreenLayout, ScreenHeader} from '@/components/common/layout'
import {createCategory, updateCategory} from '@/db/operations'
import {enhanceWithUser} from '@/db/observers'
import {useColorScheme} from '@/components/useColorScheme'
import {useDatabase} from '@nozbe/watermelondb/react'
import useStore from '@/store'

const Recurring = ({user}) => {
  const {rtxToUpdate, setRtxToUpdate} = useStore()
  const database = useDatabase()
  const mode = useColorScheme()

  const withUserId = obj => ({...obj, userId: user.id})

  const handleFormSubmit = (cat) => {
    router.back()
  }

  useEffect(() => {
    return () => setRtxToUpdate(null)
  }, [])

  return (
      <ScreenLayout>
        <VStack space="md">
          <ScreenHeader
              heading={rtxToUpdate?.id ? 'Edit Recurring Transaction' : 'New Recurring Transaction'}
          />
        </VStack>
      </ScreenLayout>
  )
}

export default enhanceWithUser(Recurring)