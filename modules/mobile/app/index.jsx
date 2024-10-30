import {useEffect, useState} from 'react'
import {router} from 'expo-router'
import {Button, ButtonText} from '@/components/ui/button'
import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {ProgressCircle} from '@/components/common/progress'
import {LogoChart} from '@/components/common/logo'
import {useColorScheme} from '@/components/useColorScheme'
import {ScreenLayout} from '@/components/common/layout'
import useStore from '@/store'
import {enhanceWithUser} from '@/db/observers'
import Text from '@/constants/text'

const Index = ({state, user}) => {
  const [isLoading, setIsLoading] = useState(true)
  const mode = useColorScheme()
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
      if (state.isAuthenticated === false) {
        setIsLoading(false)
      }

      if (state?.accessToken) {
        setAccessToken(state.accessToken)
      }
    }
  }, [state?.accessToken])

  return (
      <ScreenLayout>
        {!isLoading && (
            <VStack className="h-full w-full justify-between" space="xl">
              <VStack></VStack>
              <VStack className="items-center">
                <LogoChart mode={mode}/>
                <Heading size="3xl">
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
      </ScreenLayout>
  )
}

export default enhanceWithUser(Index)
