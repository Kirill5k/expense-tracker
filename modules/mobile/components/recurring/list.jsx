import {FlatList} from '@/components/ui/flat-list'
import {Box} from '@/components/ui/box'
import {HStack} from '@/components/ui/hstack'
import {VStack} from '@/components/ui/vstack'
import {Text} from '@/components/ui/text'
import {TagList} from '@/components/common/tag'
import {ListItemPressable, ListItemIcon} from '@/components/common/list'
import Classes from '@/constants/classes'
import {mergeClasses} from '@/utils/css'
import {calcTotal, printAmount, formatAmount, formatDate, isExpense} from '@/utils/transactions'


const RecurringTransactionListItem = ({item, onItemDelete, onItemPress, disabled}) => {
  return (
      <Box className={mergeClasses(
          'bg-background-50 px-1',
          item.isFirst && 'rounded-t-xl pt-1',
          item.isLast && 'rounded-b-xl pb-1 mb-5'
      )}>
        <ListItemPressable
            disabled={disabled}
            onPress={() => onItemPress(item)}
            onDelete={() => onItemDelete(item)}
        >
          <HStack className={Classes.listItemLayout}>
            <ListItemIcon
                icon={item.category.icon}
                color={item.category.color}
            />
            <VStack className="justify-center">
              <Text className={Classes.listItemMainText}>
                {item.category.name}
              </Text>
              {item.note && <Text className="line-clamp-1 text-md">{item.note}</Text>}
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