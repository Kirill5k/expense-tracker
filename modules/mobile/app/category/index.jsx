import {router} from 'expo-router'
import {VStack} from '@/components/ui/vstack'
import {Box} from '@/components/ui/box'
import CategoryForm from '@/components/category/form'
import {ScreenLayout, ScreenHeader} from '@/components/common/layout'
import {createCategory, updateCategory} from '@/db/operations'
import {enhanceWithUser} from '@/db/observers'
import {useColorScheme} from '@/components/useColorScheme'
import {useDatabase} from '@nozbe/watermelondb/react'
import useStore from '@/store'

const Category = ({user}) => {
  const {catToUpdate, setCatToUpdate} = useStore()
  const database = useDatabase()
  const mode = useColorScheme()

  const goBack = () => {
    setCatToUpdate(null)
    router.back()
  }

  const withUserId = obj => ({...obj, userId: user.id})

  const handleFormSubmit = (cat) => {
    const res = cat.id ? updateCategory(database, withUserId(cat)) : createCategory(database, withUserId(cat))
    return res.then(goBack)
  }

  return (
      <ScreenLayout>
        <VStack space="md">
          <ScreenHeader
              heading={catToUpdate?.id ? 'Edit Category' : 'New Category'}
              onBack={goBack}
          />
          <CategoryForm
              mode={mode}
              category={catToUpdate}
              onCancel={goBack}
              onSubmit={handleFormSubmit}
          />
        </VStack>
      </ScreenLayout>
  )
}

export default enhanceWithUser(Category)