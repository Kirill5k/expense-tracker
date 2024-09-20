import React, {useState} from 'react'
import {VStack} from '@/components/ui/vstack'
import {Divider} from '@/components/ui/divider'
import {Box} from '@/components/ui/box'
import {Heading} from '@/components/ui/heading'
import * as Progress from 'react-native-progress'
import FloatingButton from '@/components/common/floating-button'
import Modal from '@/components/common/modal'
import CategoryList from '@/components/category/list'
import CategoryForm from '@/components/category/form'
import Classes from '@/constants/classes'
import Colors from '@/constants/colors'
import useStore from '@/store'

export const Categories = () => {
  const [headerSize, setHeaderSize] = useState("2xl")
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [catToUpdate, setCatToUpdate] = useState(null)

  const {
    mode,
    categories,
    createCategory,
    updateCategory
  } = useStore()

  const handleFormSubmit = (cat) => {
    setCatToUpdate(null)
    setShowModal(false)
    setLoading(true)
    const res = cat.id ? updateCategory(cat) : createCategory(cat)
    return res.then(() => setLoading(false))
  }

  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size={headerSize} className="font-roboto pb-2">
          Categories
        </Heading>
        <Box>
          {headerSize === 'sm' && <Divider/>}
          {loading && <Progress.Bar
              height={3}
              animationType="decay"
              borderRadius={0}
              borderWidth={0}
              indeterminateAnimationDuration={250}
              width={null}
              indeterminate={true}
              color={Colors[mode].tint}
              borderColor={Colors[mode].tint}
          />}
        </Box>
        <CategoryList
            items={categories}
            disabled={loading}
            onItemPress={c => {
              setCatToUpdate(c)
              setShowModal(true)
            }}
            onItemDelete={c => {
              console.log('delete cat', c)
            }}
            onScroll={({nativeEvent}) => {
              if (nativeEvent.contentOffset.y <= 40) {
                setHeaderSize('2xl')
              } else {
                setHeaderSize('sm')
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
