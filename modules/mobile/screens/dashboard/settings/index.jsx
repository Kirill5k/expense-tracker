import {useState} from 'react'
import {Heading} from '@/components/ui/heading'
import {VStack} from '@/components/ui/vstack'
import {ScrollView} from '@/components/ui/scroll-view'
import Profile from '@/components/user/profile'
import Classes from '@/constants/classes'
import useStore from '@/store'

export const Settings = () => {
  const [headerSize, setHeaderSize] = useState("2xl")
  const {mode, user} = useStore()
  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size={headerSize} className="font-roboto pb-2">
          Settings
        </Heading>
        <ScrollView>
          <Profile
              user={user}
          />
        </ScrollView>
      </VStack>
  )
}
