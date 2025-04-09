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
import {FlashList} from '@shopify/flash-list'
import TransactionHeader from './header'
import {mergeClasses} from '@/utils/css'

// height 38.5
const TransactionGroupHeader = ({date, total}) => {
  return (
      <HStack className="bg-background-0 items-center justify-between py-2">
        <Heading size="lg">{date}</Heading>
        <Text className="text-lg">{total}</Text>
      </HStack>
  )
}

// height 63
const TransactionListItem = ({item, mode, disabled, onPress, onCopy, onDelete}) => {
  return (
      <ListItemPressable
          disabled={disabled}
          onPress={() => onPress(item)}
          onCopy={() => onCopy(item)}
          onDelete={() => onDelete(item)}
      >
        <HStack className={Classes.listItemLayout + ' '}>
          <ListItemIcon
              icon={item.category.icon}
              color={item.category.color}
          />
          <VStack className="justify-center gap-1">
            <HStack space="xs" className="items-center">
              <Text className={Classes.listItemMainText}>
                {item.note || item.category.name}
              </Text>
              {item.isRecurring && (
                  <Badge
                      className="bg-transparent p-0 pb-0.5"
                      variant="solid"
                  >
                    <BadgeIcon
                        className="text-white"
                        as={MaterialIcon}
                        code="repeat-variant"
                        dsize={20}
                        dcolor={Colors[mode].tabIconDefault}
                    />
                  </Badge>
              )}
            </HStack>
            <TagList items={item.tags} className="max-w-64"/>
          </VStack>
          <Text
              className={mergeClasses(
                  Classes.listItemAmount,
                  isExpense(item) ? 'text-red-500' : 'text-green-500'
              )}>
            {formatAmount(item)}
          </Text>
        </HStack>
      </ListItemPressable>
  )
}

const TransactionList = ({mode, disabled, items, onItemPress, onItemCopy, onItemDelete, onScroll}) => {
  const groupedItems = Object.entries(groupBy(items, i => i.date))
  const data = groupedItems.flatMap(([date, txGroup]) => {
    const header = {
      isHeader: true,
      date: formatDate({date}),
      total: printAmount(calcTotal(txGroup), txGroup[0].amount.currency)
    }
    const items = txGroup.map((item, i) => ({...item, isFirst: i === 0, isLast: i === txGroup.length - 1}))
    return [header, ...items]
  })

  const stickyHeaderIndices = data
      .map((item, i) => item.isHeader ? i : null)
      .filter((item) => item !== null)

  const flatListRef = useRef(null)
  const firstItem = items.length > 0 ? items[0].id : null

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({animated: true, offset: 0})
    }
  }, [firstItem, items.length])

  return (
      <FlashList
          ref={flatListRef}
          bounces={true}
          onScroll={onScroll}
          showsVerticalScrollIndicator={false}
          className={Classes.scrollList}
          initialNumToRender={10}
          estimatedItemSize={63}
          data={data}
          stickyHeaderIndices={stickyHeaderIndices}
          keyExtractor={(item) => item.id || item.date}
          renderItem={({item}) => (
              item.isHeader ? (
                  <TransactionGroupHeader date={item.date} total={item.total}/>
              ) : (
                  <Box className={mergeClasses(
                      'px-1 py-0.5 bg-background-50',
                      item.isFirst && 'rounded-t-xl pt-1',
                      item.isLast && 'rounded-b-xl pb-1 mb-5'
                  )}>
                    <TransactionListItem
                        key={item.id}
                        mode={mode}
                        disabled={disabled}
                        item={item}
                        onPress={onItemPress}
                        onCopy={onItemCopy}
                        onDelete={onItemDelete}
                    />
                  </Box>
              )
          )}
          ListHeaderComponent={<TransactionHeader items={items}/>}
          ListEmptyComponent={<Text className="py-10 text-center">No transactions for this period</Text>}
          ListFooterComponent={<Box className="py-3"></Box>}
          getItemType={(item) => typeof item.isHeader ? 'sectionHeader' : 'row'}
      />
  )
}

export default TransactionList