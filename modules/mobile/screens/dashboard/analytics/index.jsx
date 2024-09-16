import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import Classes from '@/constants/classes'

export const Analytics = () => {
  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size="2xl" className="font-roboto">
          Analytics
        </Heading>
      </VStack>
  )
}
