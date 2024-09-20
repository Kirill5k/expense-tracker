import React from 'react'
import {Box} from '@/components/ui/box'
import {ScrollView} from '@/components/ui/scroll-view'
import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {Text} from '@/components/ui/text'
import {MaterialIcon} from '@/components/ui/icon'
import {Avatar} from '@/components/ui/avatar'
import ListItemPressable from '@/components/common/list-item-pressable'
import Classes from '@/constants/classes'

const CategoryList = ({items, onItemPress, disabled, onItemDelete, onScroll, children}) => {
  return (
      <ScrollView
          className={Classes.scrollList}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[0]}
          onScroll={onScroll}
      >
        {children}
        <VStack className={Classes.listLayout} space="sm">
          {items.map(c => (
              <ListItemPressable
                  disabled={disabled}
                  key={c.id}
                  onPress={() => onItemPress(c)}
                  onDelete={() => onItemDelete(c)}
              >
                <HStack className="items-center p-2">
                  <Avatar size="sm" style={{backgroundColor: c.color}}>
                    <MaterialIcon
                        code={c.icon}
                        dsize={20}
                        dcolor="white"
                    />
                  </Avatar>
                  <Text className={Classes.listItemMainText + ' mx-2'}>
                    {c.name}
                  </Text>
                  <Text className="uppercase ml-auto text-typography-500 text-xs font-medium">
                    {c.kind}
                  </Text>
                </HStack>
              </ListItemPressable>
          ))}
        </VStack>
        <Box className="py-1"></Box>
      </ScrollView>
  )
}

export default CategoryList