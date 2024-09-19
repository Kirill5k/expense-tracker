import React from 'react'
import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {Text} from '@/components/ui/text'
import {Heading} from '@/components/ui/heading'
import {Avatar} from '@/components/ui/avatar'
import {MaterialIcon} from '@/components/ui/icon'
import ListItemPressable from '@/components/common/list-item-pressable'
import {groupBy} from '@/utils/arrays'
import {calcTotal, formatAmount} from '@/utils/transactions'
import Classes from '@/constants/classes'
import {format, isToday, isYesterday, parseISO} from 'date-fns'

const TransactionGroup = ({disabled, items, onItemPress, onItemCopy, onItemDelete}) => {
  return (
      <VStack className={Classes.listLayout} space="sm">
        {items.map(tx => (
            <ListItemPressable
                disabled={disabled}
                key={tx.id}
                onPress={() => onItemPress(tx)}
                onCopy={() => onItemCopy(tx)}
                onDelete={() => onItemDelete(tx)}
            >
              <HStack className="items-center p-2">
                <Avatar size="sm" style={{backgroundColor: tx.category.color}}>
                  <MaterialIcon
                      code={tx.category.icon}
                      dsize={20}
                      dcolor="white"
                  />
                </Avatar>
                <VStack className="mx-2">
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
                <Text className={`rounded-xl border text-xs font-medium p-1 px-2 ml-auto ${tx.category.kind === 'expense'
                    ? 'text-red-500 border-red-400' : 'text-green-500 border-green-400'}`}>
                  {formatAmount(tx)}
                </Text>
              </HStack>
            </ListItemPressable>
        ))}
      </VStack>
  )
}

const TransactionList = ({disabled, items, onItemPress, onItemCopy, onItemDelete}) => {
  const groupedItems = groupBy(items, i => i.date)

  const formatDate = (isoDate) => {
    const date = parseISO(isoDate);
    if (isToday(date)) {
      return 'Today'
    }
    if (isYesterday(date)) {
      return 'Yesterday'
    }
    return format(date, 'd MMMM')
  }

  return (
      <VStack className="w-full py-2" space="xl">
        {Object.entries(groupedItems).map(([date, txGroup]) => (
            <VStack key={date}>
              <HStack className="items-center">
                <Heading size="xs" className="mb-1">{formatDate(date)}</Heading>
                <Text className="text-xs ml-auto">{calcTotal(txGroup)}</Text>
              </HStack>
              <TransactionGroup
                  disabled={disabled}
                  items={txGroup}
                  onItemPress={onItemPress}
                  onItemCopy={onItemCopy}
                  onItemDelete={onItemDelete}
              />
            </VStack>
        ))}
      </VStack>
  )
}

export default TransactionList