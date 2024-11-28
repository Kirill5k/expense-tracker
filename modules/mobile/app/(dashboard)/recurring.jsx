import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {Text} from '@/components/ui/text'
import Classes from '@/constants/classes'


const Recurring = ({}) => {
  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size="2xl" className="pb-2">
          Recurring
        </Heading>
        <Text>
          {testId} - 67071900f0844c2b758161c0
        </Text>
      </VStack>
  )
}

export default Recurring
