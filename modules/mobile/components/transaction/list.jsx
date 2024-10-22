import React from 'react'
import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {Text} from '@/components/ui/text'
import {Heading} from '@/components/ui/heading'
import {ListItemPressable, ListItemIcon} from '@/components/common/list'
import {groupBy} from '@/utils/arrays'
import {calcTotal, formatAmount, formatDate, isExpense} from '@/utils/transactions'
import Classes from '@/constants/classes'
import {VirtualizedList} from '@/components/ui/virtualized-list'
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
                <VStack>
                  <Text className={Classes.listItemMainText}>
                    {tx.category.name}
                  </Text>
                  {tx.note && <Text className="line-clamp-1 text-sm">{tx.note}</Text>}
                  {tx.tags.length > 0 && <HStack space="xs" className="mt-1">
                    {tx.tags.map(t => (
                        <Text key={t} className={Classes.listItemTag}>
                          {t}
                        </Text>
                    ))}
                  </HStack>}
                </VStack>
                <Text
                    className={mergeClasses(
                        'rounded-xl border text-xs font-medium p-1 px-2 ml-auto',
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
        <HStack className="items-center">
          <Heading size="xs" className="mb-1">{formatDate(item)}</Heading>
          <Text className="text-xs ml-auto">{calcTotal(item.txGroup)}</Text>
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

  return (
      <VirtualizedList
          onScroll={onScroll}
          showsVerticalScrollIndicator={false}
          className={Classes.scrollList}
          data={groupedItems.map(([date, txGroup]) => ({date, txGroup}))}
          initialNumToRender={10}
          getItem={(data, index) => data[index]}
          keyExtractor={(item) => item.date}
          getItemCount={(d) => d.length}
          renderItem={({item}) => (
              <TransactionListItem
                  item={item}
                  disabled={disabled}
                  onItemPress={onItemPress}
                  onItemCopy={onItemCopy}
                  onItemDelete={onItemDelete}
              />
          )}
      />
  )
}

export default TransactionList