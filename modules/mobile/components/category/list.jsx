import React, {useState} from 'react'
import {VirtualizedList} from '@/components/ui/virtualized-list'
import {HStack} from '@/components/ui/hstack'
import {Text} from '@/components/ui/text'
import {MaterialIcon} from '@/components/ui/icon'
import {Avatar} from '@/components/ui/avatar'
import ListItemPressable from '@/components/common/list-item-pressable'
import Classes from '@/constants/classes'

const CategoryList = ({items, onItemPress, disabled, onItemDelete, onScroll}) => {
  const [scrolling, setScrolling] = useState(false)
  return (
      <VirtualizedList
          className={`${Classes.scrollList} ${Classes.listLayout} ${scrolling ? 'rounded-t-none' : ''}`}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          onScroll={(e) => {
            setScrolling(e.nativeEvent.contentOffset.y > 5)
            onScroll(e)
          }}
          data={items}
          getItem={(data, index) => data[index]}
          keyExtractor={(item) => item.id}
          getItemCount={data => data.length}
          renderItem={({item}) => (
              <ListItemPressable
                  disabled={disabled}
                  onPress={() => onItemPress(item)}
                  onDelete={() => onItemDelete(item)}
              >
                <HStack className="items-center p-2">
                  <Avatar size="sm" style={{backgroundColor: item.color}}>
                    <MaterialIcon
                        code={item.icon}
                        dsize={20}
                        dcolor="white"
                    />
                  </Avatar>
                  <Text className={Classes.listItemMainText + ' mx-2'}>
                    {item.name}
                  </Text>
                  <Text className="uppercase ml-auto text-typography-500 text-xs font-medium">
                    {item.kind}
                  </Text>
                </HStack>
              </ListItemPressable>
          )}
      />
  )
}

export default CategoryList