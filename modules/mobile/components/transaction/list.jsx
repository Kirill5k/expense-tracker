import React, {useRef, useEffect} from 'react'
import {Badge, BadgeIcon} from "@/components/ui/badge"
import {MaterialIcon} from '@/components/ui/icon'
import {Box} from '@/components/ui/box'
import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {Text} from '@/components/ui/text'
import {Heading} from '@/components/ui/heading'
import {TagList} from '@/components/common/tag'
import {ListItemPressable, ListItemIcon} from '@/components/common/list'
import {groupBy} from '@/utils/arrays'
import {calcTotal, printAmount, formatAmount, formatDate, isExpense} from '@/utils/transactions'
import Classes from '@/constants/classes'
import Colors from '@/constants/colors'
import {FlatList} from '@/components/ui/flat-list'
import TransactionHeader from './header'
import {mergeClasses} from '@/utils/css'

const TransactionGroup = React.memo(({mode, disabled, items, onItemPress, onItemCopy, onItemDelete}) => {
  return (
      <VStack className="rounded-xl bg-background-50 p-1" space="sm">
        {items.map(tx => (
            <ListItemPressable
                disabled={disabled}
                key={tx.id}
                onPress={() => onItemPress(tx)}
                onCopy={() => onItemCopy(tx)}
                onDelete={() => onItemDelete(tx)}
            >
              <HStack className={Classes.listItemLayout}>
                <ListItemIcon
                    icon={tx.category.icon}
                    color={tx.category.color}
                />
                <VStack className="justify-center gap-1">
                  <HStack>
                    <Text className={Classes.listItemMainText}>
                      {tx.note || tx.category.name}
                    </Text>
                  </HStack>
                  <TagList items={tx.tags} className="w-64"/>
                </VStack>
                <VStack className="ml-auto relative">
                  {tx.isRecurring && (
                      <Badge
                          className="absolute -z-10 bg-transparent -top-2 -right-4"
                          variant="solid"
                      >
                        <BadgeIcon
                            className="text-white"
                            as={MaterialIcon}
                            code="repeat-variant"
                            dsize={14}
                            dcolor={Colors[mode].tabIconDefault}
                        />
                      </Badge>
                  )}
                  <Text
                      className={mergeClasses(
                          Classes.listItemAmount,
                          isExpense(tx) ? 'text-red-500' : 'text-green-500'
                      )}>
                    {formatAmount(tx)}
                  </Text>
                </VStack>
              </HStack>
            </ListItemPressable>
        ))}
      </VStack>
  )
})

const TransactionListItem = React.memo(({mode, disabled, item, onItemPress, onItemCopy, onItemDelete}) => {
  return (
      <VStack className="mb-5">
        <HStack className="items-center justify-between py-2">
          <Heading size="lg">{formatDate(item)}</Heading>
          <Text className="text-lg">{printAmount(calcTotal(item.txGroup), item.txGroup[0].amount.currency)}</Text>
        </HStack>
        <TransactionGroup
            mode={mode}
            disabled={disabled}
            items={item.txGroup}
            onItemPress={onItemPress}
            onItemCopy={onItemCopy}
            onItemDelete={onItemDelete}
        />
      </VStack>
  )
})

const TransactionList = ({mode, disabled, items, onItemPress, onItemCopy, onItemDelete, onScroll}) => {
  const groupedItems = Object.entries(groupBy(items, i => i.date))
  const data = groupedItems.map(([date, txGroup]) => ({date, txGroup}))

  const flatListRef = useRef(null)
  const firstItem = items.length > 0 ? items[0].id : null

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({animated: true, offset: 0})
    }
  }, [firstItem, items.length])

  return (
      <FlatList
          ref={flatListRef}
          bounces={false}
          onScroll={onScroll}
          showsVerticalScrollIndicator={false}
          className={Classes.scrollList}
          initialNumToRender={10}
          data={data}
          keyExtractor={(item) => item.date}
          renderItem={({item}) => (
              <TransactionListItem
                  mode={mode}
                  item={item}
                  disabled={disabled}
                  onItemPress={onItemPress}
                  onItemCopy={onItemCopy}
                  onItemDelete={onItemDelete}
              />
          )}
          ListHeaderComponent={<TransactionHeader items={items}/>}
          ListEmptyComponent={<Text className="py-10 text-center">No transactions for this period</Text>}
          ListFooterComponent={<Box className="py-3"></Box>}
      />
  )
}

export default TransactionList