import {VStack} from '@/components/ui/vstack'
import {Text} from '@/components/ui/text'
import Classes from '@/constants/classes'

const CategoryGroupedTransactionList = ({items}) => {

  return (
      <VStack className="rounded-xl bg-background-50 p-1" space="sm">
        <Text>items length {items.length}</Text>
      </VStack>
  )
}

export default CategoryGroupedTransactionList