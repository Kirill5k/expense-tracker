import React, {useState} from "react"
import {VStack} from "@/components/ui/vstack";
import {HStack} from "@/components/ui/hstack";
import {Text} from "@/components/ui/text";
import {Heading} from "@/components/ui/heading";
import {Avatar} from "@/components/ui/avatar";
import {Pressable} from "@/components/ui/pressable"
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {groupBy} from "@/utils/arrays";
import {calcTotal, formatAmount} from "@/utils/transactions";
import {format, isToday, isYesterday, parseISO} from 'date-fns'

const TransactionGroup = ({items, onItemPress}) => {
  const [isPressed, setIsPressed] = useState(null)

  return (
      <VStack className="rounded-xl bg-background-50 p-1" space="sm">
        {items.map(tx => (
            <Pressable
                key={tx.id}
                onPressIn={() => setIsPressed(tx.id)}
                onPressOut={() => setIsPressed(null)}
                className={`rounded-xl hover:bg-background-100 ${isPressed === tx.id ? 'bg-background-200' : ''}`}
                onPress={() => onItemPress(tx)}
            >
              <HStack className="items-center px-2 py-2">
                <Avatar size="sm" style={{backgroundColor: tx.category.color}}>
                  <MaterialCommunityIcons
                      name={tx.category.icon.replaceAll('mdi-', '')}
                      size={20}
                      color="white"
                  />
                </Avatar>
                <VStack className="mx-2">
                  <Text className="font-semibold text-typography-900 line-clamp-1 p-0 m-0 text-sm">
                    {tx.category.name}
                  </Text>
                  {tx.note && <Text className="line-clamp-1 text-sm">{tx.note}</Text>}
                  {tx.tags.length > 0 && <HStack space="xs" className="mt-1">
                    {tx.tags.map(t => (
                        <Text
                            key={t}
                            className="rounded-lg border border-secondary-300 text-typography-700 text-xs font-medium px-1"
                        >
                          {t}
                        </Text>
                    ))}
                  </HStack>}
                </VStack>
                <Text className={`rounded-xl border text-xs font-medium p-1 px-2 ml-auto ${tx.kind === 'expense'
                    ? 'text-red-500 border-red-400' : 'text-green-500 border-green-400'}`}>
                  {formatAmount(tx)}
                </Text>
              </HStack>
            </Pressable>
        ))}
      </VStack>
  )
}

const TransactionList = ({items, onItemPress}) => {
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
              <HStack className="flex items-center justify-between">
                <Heading size="xs" className="mb-1">{formatDate(date)}</Heading>
                <Text className="text-xs">{calcTotal(txGroup)}</Text>
              </HStack>
              <TransactionGroup
                  items={txGroup}
                  onItemPress={onItemPress}
              />
            </VStack>
        ))}
      </VStack>
  )
}

export default TransactionList