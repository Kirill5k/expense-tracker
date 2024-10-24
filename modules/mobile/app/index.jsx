import {useEffect, useState} from 'react'
import {router} from 'expo-router'
import {Button, ButtonText} from '@/components/ui/button'
import {SafeAreaView} from '@/components/ui/safe-area-view'
import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {ProgressCircle} from '@/components/common/progress'
import {LogoChart} from '@/components/common/logo'
import {useColorScheme} from '@/components/useColorScheme'
import useStore from '@/store'
import {enhanceWithUser} from '@/db/observers'
import Text from '@/constants/text'
import Colors from '@/constants/colors'

const Index = ({state, user}) => {
  const [isLoading, setIsLoading] = useState(true)
  const colorScheme = useColorScheme()
  const {mode, setMode, setAccessToken} = useStore()

  useEffect(() => {
    if (user?.settingsDarkMode === true) {
      setMode('dark')
    } else if (user?.settingsDarkMode === false) {
      setMode('light')
    } else {
      setMode(colorScheme === ' dark' ? 'dark' : 'light')
    }

    if (state.accessToken) {
      setAccessToken(state.accessToken)
    }

    if (state.isAuthenticated && user) {
      setTimeout(() => router.push('/analytics'), 1000)
    } else {
      setIsLoading(false)
    }
  }, []);

  return (
      <SafeAreaView
          className="flex-col items-center justify-center w-full h-full"
          style={{backgroundColor: Colors[mode].splashScreenBackground}}
      >
        {!isLoading && (
            <VStack className="h-full w-full justify-between" space="xl">
              <VStack></VStack>
              <VStack className="items-center">
                <LogoChart
                    mode={mode}
                />
                <Heading size="3xl">
                  {Text.appName}
                </Heading>
              </VStack>
              <VStack className="rounded-xl bg-background-0 w-full p-10" space="xl">
                <Button onPress={() => router.push("auth/signin")}>
                  <ButtonText>Log in</ButtonText>
                </Button>
                <Button onPress={() => router.push("auth/signup")}>
                  <ButtonText>Create new account</ButtonText>
                </Button>
              </VStack>
            </VStack>
        )}
        {isLoading && <ProgressCircle mode={mode}/>}
      </SafeAreaView>
  )
}

export default enhanceWithUser(Index)
