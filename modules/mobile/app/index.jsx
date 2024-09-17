import React from 'react'
import {router} from 'expo-router'
import {Button, ButtonText} from '@/components/ui/button'
import {SafeAreaView} from '@/components/ui/safe-area-view'
import {VStack} from '@/components/ui/vstack'
import * as Progress from 'react-native-progress'
import useStore from '@/store'
import Colors from '@/constants/colors'

const Index = () => {
  const {isLoading, mode} = useStore()

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
              <Button onPress={() => router.push("/analytics")}>
                <ButtonText>Dashboard</ButtonText>
              </Button>
            </VStack>
        )}
        {isLoading && (
            <Progress.CircleSnail
                color={Colors[mode].defaultTint}
                strokeCap="butt"
                thickness={10}
                size={125}
                indeterminate={true}
            />
        )}
      </SafeAreaView>
  );
};

export default Index;