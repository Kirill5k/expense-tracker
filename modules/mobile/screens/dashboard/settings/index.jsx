import {ScrollView} from '@/components/ui/scroll-view'
import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import Profile from '@/components/user/profile'
import Classes from '@/constants/classes'
import useStore from '@/store'

export const Settings = () => {
  const {mode, user} = useStore()
  return (
      <ScrollView className="h-full w-full">
        <Profile
          user={user}
        />
        <VStack className={Classes.dashboardLayout}>
          <Heading size="2xl" className="font-roboto">
            Settings
          </Heading>
        </VStack>
      </ScrollView>
  )
}
