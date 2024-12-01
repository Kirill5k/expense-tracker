import {Divider} from '@/components/ui/divider'
import {HStack} from '@/components/ui/hstack'
import {VStack} from '@/components/ui/vstack'
import {Text} from '@/components/ui/text'
import {Heading} from '@/components/ui/heading'
import {printAmount, calcTotal} from '@/utils/transactions'
import Classes from '@/constants/classes'

const TransactionHeader = ({items}) => {

  if (!items?.length) {
    return null
  }

  return (
      <HStack className={Classes.listItemHeader}>
        <VStack className="w-2/4">
          <Text>Balance</Text>
          <Heading size="xl">{printAmount(calcTotal(items), items[0].amount.currency)}</Heading>
        </VStack>
        <Divider orientation="vertical"/>
        <VStack className="pl-3 w-2/4">
          <Text>Total Entries</Text>
          <Heading size="xl">{items.length}</Heading>
        </VStack>
      </HStack>
  )
}

export default TransactionHeader
