import React, {useEffect} from 'react'
import {router} from 'expo-router'
import {Button, ButtonText} from '@/components/ui/button'
import {SafeAreaView} from '@/components/ui/safe-area-view'
import {VStack} from '@/components/ui/vstack'
import {ProgressCircle} from '@/components/common/progress'
import useStore from '@/store'
import {useDatabase} from '@nozbe/watermelondb/react'
import {saveUser} from '@/db/operations'

const Index = () => {
  const database = useDatabase()
  const {isLoading, mode, user} = useStore()

  useEffect(() => {
    if (user != null) {
      saveUser(database, user)
    }
  }, [user])

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

export default Index;