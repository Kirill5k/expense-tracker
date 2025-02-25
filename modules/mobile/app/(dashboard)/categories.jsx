import React, {useState} from 'react'
import {router} from 'expo-router'
import {VStack} from '@/components/ui/vstack'
import {ScreenHeading} from '@/components/common/layout'
import FloatingButton from '@/components/common/floating-button'
import CategoryList from '@/components/category/list'
import Classes from '@/constants/classes'
import {useColorScheme} from '@/components/useColorScheme'
import useStore from '@/store'
import {mapCategories} from '@/db/mappers'
import {enhanceWithCategories} from '@/db/observers'
import {hideCategory} from '@/db/operations'
import {useDatabase} from '@nozbe/watermelondb/react'


const Categories = ({categories}) => {
  const database = useDatabase()
  const mode = useColorScheme()
  const {setUndoAlert, setCatToUpdate} = useStore()

  const [loading, setLoading] = useState(false)

  const displayedCategories = mapCategories(categories)

  const handleItemDelete = (cat) => {
    setLoading(true)
    hideCategory(database, cat.id, true)
        .then(() => setUndoAlert('Category has been deleted', () => hideCategory(database, cat.id, false)))
        .then(() => setLoading(false))
  }

  const handleItemPress = (cat) => {
    setCatToUpdate(cat)
    router.push('category')
  }

  return (
      <VStack className={Classes.dashboardLayout}>
        <ScreenHeading
            heading="Categories"
            loading={loading}
        />
        <CategoryList
            items={displayedCategories}
            disabled={loading}
            onItemPress={handleItemPress}
            onItemDelete={handleItemDelete}
        />
        <FloatingButton
            mode={mode}
            buttons={[
              {icon: 'bank-transfer', text: 'Transaction', onPress: () => router.push('transaction')},
              {icon: 'calendar-sync-outline', text: 'Recurring', onPress: () => router.push('recurring')},
              {icon: 'shape', text: 'Category', onPress: () => router.push('category')},
            ]}
        />
      </VStack>
  )
}

export default enhanceWithCategories(Categories)