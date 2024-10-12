import React, {useState} from 'react'
import {VStack} from '@/components/ui/vstack'
import {Divider} from '@/components/ui/divider'
import {Heading} from '@/components/ui/heading'
import {ProgressBar} from '@/components/common/progress'
import FloatingButton from '@/components/common/floating-button'
import Modal from '@/components/common/modal'
import CategoryList from '@/components/category/list'
import CategoryForm from '@/components/category/form'
import Classes from '@/constants/classes'
import useStore from '@/store'
import {mapCategories} from '@/db/mappers'
import {enhanceWithCategories} from '@/db/observers'
import {createCategory, updateCategory, hideCategory} from '@/db/operations'
import {useDatabase} from '@nozbe/watermelondb/react'

const Categories = ({user, categories, state}) => {
  const database = useDatabase()
  const {mode, setUndoAlert} = useStore()

  const [isScrolling, setIsScrolling] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [catToUpdate, setCatToUpdate] = useState(null)

  const displayedCategories = mapCategories(categories)
  const withUserId = obj => ({...obj, userId: user.id})

  const handleFormSubmit = (cat) => {
    setLoading(true)
    setShowModal(false)
    setCatToUpdate(null)
    const res = cat.id ? updateCategory(database, withUserId(cat)) : createCategory(database, withUserId(cat))
    return res.then(() => setLoading(false))
  }

  const handleItemDelete = (cat) => {
    setLoading(true)
    hideCategory(database, cat.id, true)
        .then(() => setUndoAlert('Category has been deleted', () => hideCategory(database, cat.id, false)))
        .then(() => setLoading(false))
  }

  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size={isScrolling ? 'sm' : '2xl'} className={loading ? 'pb-0' : 'pb-2'}>
          Categories
        </Heading>
        {isScrolling && <Divider/>}
        {loading && <ProgressBar mode={mode}/>}
        <CategoryList
            items={displayedCategories}
            disabled={loading}
            onItemPress={c => {
              setCatToUpdate(c)
              setShowModal(true)
            }}
            onItemDelete={handleItemDelete}
            onScroll={({nativeEvent}) => {
              if (nativeEvent.contentOffset.y <= 20 && isScrolling) {
                setIsScrolling(false)
              } else if (nativeEvent.contentOffset.y > 20 && !isScrolling) {
                setIsScrolling(true)
              }
            }}
        />
        <FloatingButton
            onPress={() => {
              setCatToUpdate(null)
              setShowModal(true)
            }}
            mode={mode}
            iconCode={"plus"}
        />
        <Modal
            headerTitle={catToUpdate?.id ? 'Edit Category' : 'New Category'}
            isOpen={showModal}
            onClose={() => {
              setCatToUpdate(null)
              setShowModal(false)
            }}
        >
          <CategoryForm
              mode={mode}
              category={catToUpdate}
              onCancel={() => {
                setCatToUpdate(null)
                setShowModal(false)
              }}
              onSubmit={handleFormSubmit}
          />
        </Modal>
      </VStack>
  )
}

export default enhanceWithCategories(Categories)