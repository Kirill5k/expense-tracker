import {FlatList} from '@/components/ui/flat-list'
import {Icon, CalendarDaysIcon, ClockIcon} from '@/components/ui/icon'
import {Divider} from '@/components/ui/divider'
import {Box} from '@/components/ui/box'
import {HStack} from '@/components/ui/hstack'
import {VStack} from '@/components/ui/vstack'
import {Text} from '@/components/ui/text'
import {TagList} from '@/components/common/tag'
import {ListItemPressable, ListItemIcon} from '@/components/common/list'
import Classes from '@/constants/classes'
import {mergeClasses} from '@/utils/css'
import {formatAmount, isExpense} from '@/utils/transactions'
import { parseISO, format } from 'date-fns'


const recurrenceFreqMappings = {
  'monthly': 'month',
  'daily': 'day',
  'weekly': 'week'
}

const RecurrenceLabel = ({item}) => {
  const freq = item.recurrence.frequency
  const interval = item.recurrence.interval
  const nextDate = item.recurrence.nextDate

  let text = recurrenceFreqMappings[freq]
  if (interval > 1) {
    text = `${interval} ${text}s`
  }

  return (
      <HStack space="xs" className="items-center pb-1">
        <Icon as={CalendarDaysIcon} className="text-typography-500 w-3 h-3" />
        <Text className="text-xs">Every {text}</Text>
        <Divider orientation="vertical" className="mx-1" />
        <Icon as={ClockIcon} className="text-typography-500 w-3 h-3" />
        <Text className="text-xs">Next {format(parseISO(nextDate), 'dd/MM/yyyy')}</Text>
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
                    'rounded-xl border text-md font-medium p-1 px-2 ml-auto',
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
  const data = items.map((item, i) => ({...item, isLast: i === items.length - 1, isFirst: i === 0}))
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
      />
  )
}

export default RecurringTransactionList