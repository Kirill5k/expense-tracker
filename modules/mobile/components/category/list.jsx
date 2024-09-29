import React from 'react'
import {VirtualizedList} from '@/components/ui/virtualized-list'
import {Box} from '@/components/ui/box'
import {HStack} from '@/components/ui/hstack'
import {Text} from '@/components/ui/text'
import {MaterialIcon} from '@/components/ui/icon'
import {Avatar} from '@/components/ui/avatar'
import ListItemPressable from '@/components/common/list-item-pressable'
import Classes from '@/constants/classes'

const CategoryListItem = React.memo(({item, onItemPress, disabled, onItemDelete}) => {
  return (
      <Box className={`bg-background-50 px-1 ${item.isFirst ? 'rounded-t-xl pt-1' : ''} ${item.isLast
          ? 'rounded-b-xl pb-1' : ''}`}>
        <ListItemPressable
            disabled={disabled}
            onPress={() => onItemPress(item)}
            onDelete={() => onItemDelete(item)}
        >
          <HStack className="items-center p-3">
            <Avatar size="sm" style={{backgroundColor: item.color}}>
              <MaterialIcon
                  code={item.icon}
                  dsize={20}
                  dcolor="white"
              />
            </Avatar>
            <Text className={Classes.listItemMainText + ' ml-4'}>
              {item.name}
            </Text>
            <Text className="uppercase ml-auto text-typography-500 text-xs font-medium">
              {item.kind}
            </Text>
          </HStack>
        </ListItemPressable>
      </Box>
  )
})

const CategoryList = ({items, onItemPress, disabled, onItemDelete, onScroll}) => {
  return (
      <VirtualizedList
          className={Classes.scrollList}
          showsVerticalScrollIndicator={false}
          initialNumToRender={11}
          onScroll={onScroll}
          data={items}
          getItem={(data, index) => ({...data[index], isLast: index === data.length - 1, isFirst: index === 0})}
          keyExtractor={(item) => item.id}
          getItemCount={data => data.length}
          renderItem={({item}) => (
              <CategoryListItem
                  onItemPress={onItemPress}
                  disabled={disabled}
                  onItemDelete={onItemDelete}
                  item={item}
              />
          )}
      />
  )
}

export default CategoryList