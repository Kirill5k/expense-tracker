import React, {useRef, useEffect} from 'react'
import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {Text} from '@/components/ui/text'
import {Heading} from '@/components/ui/heading'
import {TagList} from '@/components/common/tag'
import {ListItemPressable, ListItemIcon} from '@/components/common/list'
import {groupBy} from '@/utils/arrays'
import {calcTotal, printAmount, formatAmount, formatDate, isExpense} from '@/utils/transactions'
import Classes from '@/constants/classes'
import {FlatList} from '@/components/ui/flat-list'
import {mergeClasses} from '@/utils/css'


const TransactionGroup = React.memo(({disabled, items, onItemPress, onItemCopy, onItemDelete}) => {
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
                <Text
                    className={mergeClasses(
                        Classes.listItemAmount,
                        isExpense(tx) ? 'text-red-500 border-red-400' : 'text-green-500 border-green-400'
                    )}>
                  {formatAmount(tx)}
                </Text>
              </HStack>
            </ListItemPressable>
        ))}
      </VStack>
  )
})

const TransactionListItem = React.memo(({disabled, item, onItemPress, onItemCopy, onItemDelete}) => {
  return (
      <VStack className="mb-5">
        <HStack className="items-center justify-between">
          <Heading size="md" className="mb-1">{formatDate(item)}</Heading>
          <Text className="text-md">{printAmount(calcTotal(item.txGroup), item.txGroup[0].amount.currency)}</Text>
        </HStack>
        <TransactionGroup
            disabled={disabled}
            items={item.txGroup}
            onItemPress={onItemPress}
            onItemCopy={onItemCopy}
            onItemDelete={onItemDelete}
        />
      </VStack>
  )
})

const TransactionList = ({disabled, items, onItemPress, onItemCopy, onItemDelete, onScroll}) => {
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
                  item={item}
                  disabled={disabled}
                  onItemPress={onItemPress}
                  onItemCopy={onItemCopy}
                  onItemDelete={onItemDelete}
              />
          )}
          ListEmptyComponent={<Text className="py-10 text-center">No transactions for this period</Text>}
      />
  )
}

export default TransactionList