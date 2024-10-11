import {router} from 'expo-router'
import {Button, ButtonText} from '@/components/ui/button'
import {SafeAreaView} from '@/components/ui/safe-area-view'
import {VStack} from '@/components/ui/vstack'
import {ProgressCircle} from '@/components/common/progress'
import {useColorScheme} from '@/components/useColorScheme'
import useStore from '@/store'
import {withDatabase, compose, withObservables} from '@nozbe/watermelondb/react'

const Index = ({state}) => {
  const colorScheme = useColorScheme()
  const {isLoading, mode, setMode} = useStore()

  //TODO: update mode when user updates settings
  if (state?.user?.settings?.darkMode === true) {
    setMode('dark')
  } else if (state?.user?.settings?.darkMode === false) {
    setMode('light')
  } else {
    setMode(colorScheme === ' dark' ? 'dark' : 'light')
  }

  console.log('state', state)

  if (state.isAuthenticated && state.user) {
    console.log('going to analytics')
    router.push('/analytics')
  }

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
        }),
    )
)

export default enhance(Index)
