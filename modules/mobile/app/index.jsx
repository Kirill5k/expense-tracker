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
    if (user?.settingsDarkMode === true && mode !== 'dark') {
      setMode('dark')
    } else if (user?.settingsDarkMode === false && mode !== 'light') {
      setMode('light')
    } else {
      setMode(colorScheme === 'dark' ? 'dark' : 'light')
    }
    if (user) {
      setTimeout(() => router.push('/analytics'), 1000)
    }
  }, [user])

  useEffect(() => {
    if (state) {
      if (state.isAuthenticated === false) {
        setIsLoading(false)
      }

      if (state?.accessToken) {
        setAccessToken(state.accessToken)
      }
    }
  }, [state?.accessToken])

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
              <VStack className="rounded-xl w-full p-10" space="xl">
                <Button size="lg" onPress={() => router.push("auth/signin")}>
                  <ButtonText>Log in</ButtonText>
                </Button>
                <Button size="lg" onPress={() => router.push("auth/signup")}>
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
