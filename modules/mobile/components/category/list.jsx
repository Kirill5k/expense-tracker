import React, {useMemo} from 'react'
import {FlashList} from '@shopify/flash-list'
import {Box} from '@/components/ui/box'
import {HStack} from '@/components/ui/hstack'
import {Text} from '@/components/ui/text'
import {ListItemPressable, ListItemIcon} from '@/components/common/list'
import Classes from '@/constants/classes'
import {mergeClasses} from '@/utils/css'


const CategoryListItem = React.memo(({item, onItemPress, disabled, onItemDelete}) => {
  const handleItemPress = () => onItemPress(item)
  const handleItemDelete = () => onItemDelete(item)
  return (
      <Box className={mergeClasses(
          'bg-background-50 px-1',
          item.isFirst && 'rounded-t-xl',
          item.isLast && 'rounded-b-xl mb-5'
      )}>
        <ListItemPressable
            disabled={disabled}
            onPress={handleItemPress}
            onDelete={handleItemDelete}
        >
          <HStack className={Classes.listItemLayout}>
            <ListItemIcon
                icon={item.icon}
                color={item.color}
            />
            <Text className={Classes.listItemMainText}>
              {item.name}
            </Text>
            <Text className="uppercase ml-auto text-typography-500 text-md font-medium">
              {item.kind}
            </Text>
          </HStack>
        </ListItemPressable>
      </Box>
  )
})

const CategoryList = ({items, onItemPress, disabled, onItemDelete, onScroll}) => {
  const data = useMemo(
      () => items.map((item, i) => ({...item, isLast: i === items.length - 1, isFirst: i === 0})),
      [items]
  )
  return (
      <FlashList
          bounces={true}
          className={Classes.scrollList}
          showsVerticalScrollIndicator={false}
          initialNumToRender={13}
          estimatedItemSize={63}
          onScroll={onScroll}
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({item}) => (
              <CategoryListItem
                  onItemPress={onItemPress}
                  disabled={disabled}
                  onItemDelete={onItemDelete}
                  item={item}
              />
          )}
          ListEmptyComponent={<Text className="py-10 text-center">No categories found</Text>}
          ListFooterComponent={<Box className="py-3"></Box>}
      />
  )
}

export default CategoryList