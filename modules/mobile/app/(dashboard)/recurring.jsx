import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import Classes from '@/constants/classes'

const Recurring = ({}) => {

  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size="2xl" className="pb-2">
          Recurring
        </Heading>
      </VStack>
  )
}

export default Recurring
