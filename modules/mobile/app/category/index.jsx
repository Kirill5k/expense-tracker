import {useEffect} from 'react'
import {router} from 'expo-router'
import CategoryForm from '@/components/category/form'
import {ScreenLayout, ScreenHeader} from '@/components/common/layout'
import {createCategory, updateCategory} from '@/db/operations'
import {enhanceWithUser} from '@/db/observers'
import {useColorScheme} from '@/components/useColorScheme'
import {useDatabase} from '@nozbe/watermelondb/react'
import useStore from '@/store'

const Category = ({user}) => {
  const {catToUpdate, setCatToUpdate, setErrorAlert} = useStore()
  const database = useDatabase()
  const mode = useColorScheme()

  const withUserId = obj => ({...obj, userId: user.id})

  const handleFormSubmit = (cat) => {
    const res = cat.id
        ? updateCategory(database, withUserId(cat))
        : createCategory(database, withUserId(cat))
    return res.then(() => router.back()).catch((err) => setErrorAlert(err.message))
  }

  useEffect(() => {
    return () => setCatToUpdate(null)
  }, [])

  return (
      <ScreenLayout>
        <ScreenHeader
            heading={catToUpdate?.id ? 'Edit Category' : 'New Category'}
        />
        <CategoryForm
            flat
            mode={mode}
            category={catToUpdate}
            onCancel={() => router.back()}
            onSubmit={handleFormSubmit}
        />
      </ScreenLayout>
  )
}

export default enhanceWithUser(Category)