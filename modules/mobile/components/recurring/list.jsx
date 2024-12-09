import {FlatList} from '@/components/ui/flat-list'
import {Icon, CalendarDaysIcon, ClockIcon} from '@/components/ui/icon'
import {Divider} from '@/components/ui/divider'
import {Box} from '@/components/ui/box'
import {HStack} from '@/components/ui/hstack'
import {VStack} from '@/components/ui/vstack'
import {Text} from '@/components/ui/text'
import {TagList} from '@/components/common/tag'
import {ListItemPressable, ListItemIcon} from '@/components/common/list'
import RecurringTransactionHeader from '@/components/recurring/header'
import Classes from '@/constants/classes'
import {mergeClasses} from '@/utils/css'
import {formatAmount, isExpense} from '@/utils/transactions'
import { parseISO, format } from 'date-fns'


const RecurrenceLabel = ({item}) => {
  const freq = item.recurrence.frequency
  const interval = item.recurrence.interval

  let label = '';

  switch (freq) {
    case 'daily':
      label = interval === 1 ? 'Daily' : `Every ${interval} days`;
      break;
    case 'weekly':
      label = interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      break;
    case 'monthly':
      label = interval === 1 ? 'Monthly' : `Every ${interval} months`;
      break;
    default:
      label = 'Unknown frequency';
  }

  const nextDate = item.recurrence.nextDate
  const hasNext = !nextDate ? false : nextDate < item.recurrence.endDate
  const nextDateLabel = hasNext
      ? `Next ${format(parseISO(nextDate), 'dd/MM/yyyy')}`
      : 'No More Scheduled'
  return (
      <HStack space="xs" className="items-center pb-1">
        <Icon as={CalendarDaysIcon} className="text-typography-500 w-3 h-4" />
        <Text className="text-xs">{label}</Text>
        <Divider orientation="vertical" className="mx-1" />
        <Icon as={ClockIcon} className="text-typography-500 w-3 h-4" />
        <Text className="text-xs">{nextDateLabel}</Text>
      </HStack>
  )
}


const RecurringTransactionListItem = ({item, onItemDelete, onItemPress, disabled}) => {
  const handleItemPress = () => onItemPress(item)
  const handleItemDelete = () => onItemDelete(item)
  return (
      <Box className={mergeClasses(
          'bg-background-50 px-1',
          item.isFirst && 'rounded-t-xl pt-1',
          item.isLast && 'rounded-b-xl pb-1 mb-5'
      )}>
        <ListItemPressable
            disabled={disabled}
            onPress={handleItemPress}
            onDelete={handleItemDelete}
        >
          <HStack className={Classes.listItemLayout}>
            <ListItemIcon
                icon={item.category.icon}
                color={item.category.color}
            />
            <VStack className="justify-center gap-1">
              <Text className={Classes.listItemMainText}>
                {item.note || item.category.name}
              </Text>
              <RecurrenceLabel item={item}/>
              <TagList items={item.tags} className="w-64"/>
            </VStack>
            <Text
                className={mergeClasses(
                    Classes.listItemAmount,
                    isExpense(item) ? 'text-red-500 border-red-400' : 'text-green-500 border-green-400'
                )}>
              {formatAmount(item)}
            </Text>
          </HStack>
        </ListItemPressable>
      </Box>
  )
}

const RecurringTransactionList = ({items, onScroll, onItemPress, onItemDelete, disabled}) => {
  const nonNullDates = items.filter(i => i.recurrence.nextDate !== null)
  const nullDates = items.filter(i => i.recurrence.nextDate === null)
  const data = nonNullDates.concat(nullDates).map((item, i) => ({...item, isLast: i === items.length - 1, isFirst: i === 0}))
  return (
      <FlatList
          bounces={false}
          className={Classes.scrollList}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          onScroll={onScroll}
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({item}) => (
              <RecurringTransactionListItem
                  onItemPress={onItemPress}
                  disabled={disabled}
                  onItemDelete={onItemDelete}
                  item={item}
              />
          )}
          ListHeaderComponent={<RecurringTransactionHeader items={items}/>}
          ListEmptyComponent={<Text className="py-10 text-center">No recurring transactions found</Text>}
      />
  )
}

export default RecurringTransactionList