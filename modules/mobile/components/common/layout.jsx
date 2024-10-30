import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {Text} from '@/components/ui/text'
import {SafeAreaView} from '@/components/ui/safe-area-view'
import {ScrollView} from '@/components/ui/scroll-view'
import {Pressable} from '@/components/ui/pressable'
import {ArrowLeftIcon, Icon} from '@/components/ui/icon'
import {router} from 'expo-router'

export const ScreenHeader = ({heading, subHeading}) => {
  return (
      <>
        <Pressable onPress={() => router.back()}>
          <Icon
              as={ArrowLeftIcon}
              className="text-background-800"
              size="xl"
          />
        </Pressable>
        <VStack>
          <Heading size="2xl">
            {heading}
          </Heading>
          {subHeading && <Text>{subHeading}</Text>}
        </VStack>
      </>
  )
}


export const ScreenLayout = ({children}) => {
  return (
      <SafeAreaView className="w-full h-full bg-background-0">
        <ScrollView
            className="w-full h-full"
            contentContainerStyle={{flexGrow: 1}}
        >
          <VStack className="w-full h-full p-9 gap-16">
            {children}
          </VStack>
        </ScrollView>
      </SafeAreaView>
  )
}