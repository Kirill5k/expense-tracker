import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {Text} from '@/components/ui/text'
import {ListItemIcon} from '@/components/common/list'
import Classes from '@/constants/classes'
import {sortedBy} from '@/utils/arrays'
import {printAmount, formatDate, formatAmount, isExpense} from '@/utils/transactions'
import {Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent} from '@/components/ui/accordion'
import React from "react";

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

const CategoryGroupedTransactionList = ({items}) => {
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
                        <VStack>
                          <Text className={Classes.listItemMainText}>{item.category.name}</Text>
                          <Text className="line-clamp-1 text-sm">
                            {item.transactions.length} {item.transactions.length === 1 ? 'transaction' : 'transactions'}
                          </Text>
                        </VStack>
                        <VStack className="ml-auto">
                          <Text className={Classes.listItemMainText}>{printAmountAdjusted(item)}</Text>
                          <Text className="line-clamp-1 text-sm text-right">{printPercentage(item)}</Text>
                        </VStack>
                      </HStack>
                  )}
                </AccordionTrigger>
              </AccordionHeader>
              <AccordionContent className="pt-0 mt-0">
                <VStack space="sm">
                  {item.transactions.map(tx => (
                      <HStack key={tx.id} className="w-full justify-between bg-background-100 rounded-xl py-2 px-4">
                        <VStack className="items-start">
                          <Text className="line-clamp-1 text-xs text-right font-semibold">{formatDate(tx)}</Text>
                          {tx.note && <Text className="line-clamp-1 text-sm">{tx.note}</Text>}
                          {tx.tags.length > 0 && <HStack space="xs" className="mt-1">
                            {tx.tags.map(t => (
                                <Text key={t} className={Classes.listItemTag}>
                                  {t}
                                </Text>
                            ))}
                          </HStack>}
                        </VStack>
                        <Text className="line-clamp-1 text-xs text-right font-semibold">{formatAmount(tx)}</Text>
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