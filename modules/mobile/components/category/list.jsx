import React from 'react'
import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {Text} from '@/components/ui/text'
import {MaterialIcon} from '@/components/ui/icon'
import {Avatar} from '@/components/ui/avatar'
import ListItemPressable from '@/components/common/list-item-pressable'
import Classes from '@/constants/classes'

const CategoryList = ({items, onItemPress, disabled}) => {
  return (
      <VStack className={Classes.listLayout} space="sm">
        {items.map(c => (
            <ListItemPressable
                disabled={disabled}
                key={c.id}
                onPress={() => onItemPress(c)}
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
                <Text className={Classes.listItemMainText + ' ml-auto'}>
                  {c.kind}
                </Text>
              </HStack>
            </ListItemPressable>
        ))}
      </VStack>
  )
}

export default CategoryList