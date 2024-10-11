import {useEffect, useState} from 'react'
import {router} from 'expo-router'
import {Button, ButtonText} from '@/components/ui/button'
import {SafeAreaView} from '@/components/ui/safe-area-view'
import {VStack} from '@/components/ui/vstack'
import {ProgressCircle} from '@/components/common/progress'
import {useColorScheme} from '@/components/useColorScheme'
import useStore from '@/store'
import {withDatabase, compose, withObservables} from '@nozbe/watermelondb/react'

const Index = ({state, user}) => {
  const [isLoading, setIsLoading] = useState(true)
  const colorScheme = useColorScheme()
  const {mode, setMode} = useStore()

  //TODO: update mode when user updates settings
  useEffect(() => {
    if (user?.settings?.darkMode === true) {
      setMode('dark')
    } else if (user?.settings?.darkMode === false) {
      setMode('light')
    } else {
      setMode(colorScheme === ' dark' ? 'dark' : 'light')
    }

    if (state.isAuthenticated && user) {
      setTimeout(() => router.push('/analytics'), 1000)
    } else {
      setIsLoading(false)
    }
  }, [state]);

  return (
      <SafeAreaView className="md:flex flex-col items-center justify-center md:w-full h-full">
        {!isLoading && (
            <VStack className="p-2 md:max-w-[440px] w-full" space="xl">
              <Button onPress={() => router.push("auth/signin")}>
                <ButtonText>Sign In</ButtonText>
              </Button>
              <Button onPress={() => router.push("auth/signup")}>
                <ButtonText>Sign Up</ButtonText>
              </Button>
            </VStack>
        )}
        {isLoading && <ProgressCircle mode={mode}/>}
      </SafeAreaView>
  );
};

const enhance = compose(
    withDatabase,
    withObservables([], ({database}) => ({
      state: database.get('state').findAndObserve('expense-tracker'),
    })),
    withObservables(['state'], ({state}) => ({
      user: state.user.observe()
    }))
)

export default enhance(Index)
