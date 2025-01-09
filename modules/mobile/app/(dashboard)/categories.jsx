import React, {useState} from 'react'
import {router} from 'expo-router'
import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {ProgressBar} from '@/components/common/progress'
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

  const [isScrolling, setIsScrolling] = useState(false)
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
        <Heading size={isScrolling ? 'md' : '2xl'} className={loading ? 'pb-0' : 'pb-2'}>
          Categories
        </Heading>
        {loading && <ProgressBar mode={mode}/>}
        <CategoryList
            items={displayedCategories}
            disabled={loading}
            onItemPress={handleItemPress}
            onItemDelete={handleItemDelete}
            onScroll={({nativeEvent}) => {
              if (nativeEvent.contentOffset.y <= 20 && isScrolling) {
                setIsScrolling(false)
              } else if (nativeEvent.contentOffset.y > 20 && !isScrolling) {
                setIsScrolling(true)
              }
            }}
        />
      </VStack>
  )
}

export default enhanceWithCategories(Categories)