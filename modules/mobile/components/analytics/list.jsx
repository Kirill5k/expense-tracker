import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {Badge, BadgeIcon} from "@/components/ui/badge"
import {MaterialIcon} from '@/components/ui/icon'
import {Text} from '@/components/ui/text'
import {ListItemIcon} from '@/components/common/list'
import {TagList} from '@/components/common/tag'
import Classes from '@/constants/classes'
import Colors from '@/constants/colors'
import {sortedBy} from '@/utils/arrays'
import {printAmount, formatDate, formatAmount, isExpense} from '@/utils/transactions'
import {Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent} from '@/components/ui/accordion'

const prepareData = (txs) => {
  let total = 0

  const groupedTxs = txs.reduce((acc, tx) => {
    const catId = tx.category.id
    if (!acc[catId]) {
      acc[catId] = {category: tx.category, totalAmount: 0, transactions: [], currency: tx.amount.currency}
    }
    acc[catId].transactions.push(tx)
    acc[catId].totalAmount += tx.amount.value
    total += tx.amount.value
    return acc
  }, {})

  return {
    total,
    data: sortedBy(Object.values(groupedTxs), i => i.totalAmount, false)
  }
}

const CategoryGroupedTransactionList = ({items, mode}) => {
  const {data, total} = prepareData(items)

  if (items.length === 0) {
    return null
  }

  const printAmountAdjusted = (item) => {
    const totalAmount = isExpense(item) ? -item.totalAmount : item.totalAmount
    return printAmount(totalAmount, item.currency)
  }

  const printPercentage = (item) => {
    return `${Math.round(item.totalAmount * 100 / total)}%`
  }

  return (
      <Accordion
          size="sm"
          variant="unfilled"
          type="single"
          className="rounded-xl bg-background-50"
      >
        {data.map((item) => (
            <AccordionItem key={item.category.id} value={item.category.id}>
              <AccordionHeader>
                <AccordionTrigger className="my-0 py-4">
                  {({isExpanded}) => (
                      <HStack className="w-full" key={item.category.id}>
                        <ListItemIcon
                            icon={item.category.icon}
                            color={item.category.color}
                        />
                        <VStack className="justify-center">
                          <Text className={Classes.listItemMainText}>{item.category.name}</Text>
                          <Text className="line-clamp-1 text-md">
                            {item.transactions.length} {item.transactions.length === 1 ? 'transaction' : 'transactions'}
                          </Text>
                        </VStack>
                        <VStack className="justify-center ml-auto">
                          <Text className={Classes.listItemMainText}>{printAmountAdjusted(item)}</Text>
                          <Text className="line-clamp-1 text-md text-right">{printPercentage(item)}</Text>
                        </VStack>
                      </HStack>
                  )}
                </AccordionTrigger>
              </AccordionHeader>
              <AccordionContent className="pt-0 mt-0">
                <VStack space="sm">
                  {item.transactions.map(tx => (
                      <HStack key={tx.id} className="w-full justify-between bg-background-100 rounded-xl py-3 px-3">
                        <VStack className="items-start gap-1">
                          <HStack space="xs" className="items-center">
                            <Text className="line-clamp-1 text-md text-right font-semibold">{formatDate(tx)}</Text>
                            {tx.isRecurring && (
                                <Badge
                                    className="bg-transparent p-0"
                                    variant="solid"
                                >
                                  <BadgeIcon
                                      className="text-white"
                                      as={MaterialIcon}
                                      code="repeat-variant"
                                      dsize={16}
                                      dcolor={Colors[mode].tabIconDefault}
                                  />
                                </Badge>
                            )}
                          </HStack>
                          {tx.note && <Text className="line-clamp-1 text-md">{tx.note}</Text>}
                          <TagList items={tx.tags}/>
                        </VStack>
                        <Text className="line-clamp-1 text-md text-right font-semibold">{formatAmount(tx)}</Text>
                      </HStack>
                  ))}
                </VStack>
              </AccordionContent>
            </AccordionItem>
        ))}
      </Accordion>
  )
}

export default CategoryGroupedTransactionList