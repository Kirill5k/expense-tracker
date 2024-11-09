import {Platform} from 'react-native'
import {router} from 'expo-router'
import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {Text} from '@/components/ui/text'
import {KeyboardAvoidingView} from '@/components/ui/keyboard-avoiding-view'
import {ScrollView} from '@/components/ui/scroll-view'
import {Pressable} from '@/components/ui/pressable'
import {ArrowLeftIcon, Icon} from '@/components/ui/icon'

export const ScreenHeader = ({heading, subHeading, onBack = () => router.back()}) => {
  return (
      <>
        <Pressable onPress={onBack}>
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
      <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="w-full h-full bg-background-0 py-5"
      >
        <ScrollView
            className="w-full h-full"
            contentContainerStyle={{flexGrow: 1}}
        >
          <VStack className="w-full h-full p-9 gap-16">
            {children}
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
  )
}