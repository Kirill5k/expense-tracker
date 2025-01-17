import {useEffect, useState} from 'react'
import {router} from 'expo-router'
import {Button, ButtonText} from '@/components/ui/button'
import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {ProgressCircle} from '@/components/common/progress'
import {LogoChart} from '@/components/common/logo'
import {useColorScheme} from '@/components/useColorScheme'
import {SafeAreaView} from '@/components/ui/safe-area-view'
import useStore from '@/store'
import {enhanceWithUser} from '@/db/observers'
import Text from '@/constants/text'

const Index = ({state, user}) => {
  const [isLoading, setIsLoading] = useState(true)
  const mode = useColorScheme() || 'light'
  const {setMode, setAccessToken} = useStore()

  useEffect(() => {
    if (user?.settingsDarkMode === true) {
      setMode('dark')
    } else if (user?.settingsDarkMode === false) {
      setMode('light')
    }

    if (user) {
      setTimeout(() => router.push('/analytics'), 1000)
    }
  }, [user])

  useEffect(() => {
    if (state) {
      if (state.isAuthenticated === false || !state.userId) {
        setIsLoading(false)
      }

      if (state?.accessToken) {
        setAccessToken(state.accessToken)
      }
    }
  }, [state?.accessToken])

  return (
      <SafeAreaView className="w-full h-full bg-background-0">
        {!isLoading && (
            <VStack className="h-full w-full justify-between p-9" space="xl">
              <VStack></VStack>
              <VStack className="items-center relative">
                <LogoChart imageBased mode={mode}/>
                <Heading size="3xl" className="absolute -bottom-4">
                  {Text.appName}
                </Heading>
              </VStack>
              <VStack className="rounded-xl w-full" space="xl">
                <Button size="lg" onPress={() => router.push("auth/signin")}>
                  <ButtonText>Log in</ButtonText>
                </Button>
                <Button size="lg" onPress={() => router.push("auth/signup")}>
                  <ButtonText>Create new account</ButtonText>
                </Button>
              </VStack>
            </VStack>
        )}
        {isLoading && (
            <VStack className="justify-center items-center w-full h-full">
              <ProgressCircle mode={mode}/>
            </VStack>
        )}
      </SafeAreaView>
  )
}

export default enhanceWithUser(Index)
