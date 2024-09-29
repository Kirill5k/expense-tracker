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

const Categories = () => {
  const [isScrolling, setIsScrolling] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [catToUpdate, setCatToUpdate] = useState(null)

  const {
    mode,
    displayedCategories,
    createCategory,
    updateCategory,
    hideCategory
  } = useStore()

  const handleFormSubmit = (cat) => {
    setShowModal(false)
    setCatToUpdate(null)
    setLoading(true)
    const res = cat.id ? updateCategory(cat) : createCategory(cat)
    return res.then(() => setLoading(false))
  }

  const handleItemDelete = (cat) => {
    const setHidden = (hidden, undoAction) => {
      setLoading(true)
      hideCategory(cat.id, hidden, undoAction).then(() => setLoading(false))
    }

    setHidden(true, () => setHidden(false, null))
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

export default Categories