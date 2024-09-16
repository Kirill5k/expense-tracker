import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import Classes from '@/constants/classes'

export const Settings = () => {
  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size="2xl" className="font-roboto">
          Settings
        </Heading>
      </VStack>
  )
}
