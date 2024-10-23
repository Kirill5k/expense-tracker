import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {Text} from '@/components/ui/text'
import {SafeAreaView} from '@/components/ui/safe-area-view'
import {ScrollView} from '@/components/ui/scroll-view'
import {Pressable} from '@/components/ui/pressable'
import {ArrowLeftIcon, Icon} from '@/components/ui/icon'
import {router} from 'expo-router'

export const AuthHeader = ({heading, subHeading}) => {
  return (
      <>
        <Pressable onPress={() => router.back()}>
          <Icon
              as={ArrowLeftIcon}
              className="md:hidden text-background-800"
              size="xl"
          />
        </Pressable>
        <VStack>
          <Heading className="md:text-center" size="2xl">
            {heading}
          </Heading>
          <Text>{subHeading}</Text>
        </VStack>
      </>
  )
}


export const AuthLayout = ({children}) => {
  return (
      <SafeAreaView className="w-full h-full bg-background-0">
        <ScrollView
            className="w-full h-full"
            contentContainerStyle={{flexGrow: 1}}
        >
          <VStack className="w-full h-full flex-grow justify-center">
            <VStack
                className="md:items-center md:justify-center flex-1 w-full p-9 md:gap-10 gap-16 md:m-auto md:w-[500px] h-full">
              {children}
            </VStack>
          </VStack>
        </ScrollView>
      </SafeAreaView>
  )
}