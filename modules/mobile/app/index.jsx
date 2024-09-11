import React, { useEffect } from 'react';
import { Button, ButtonText } from "@/components/ui/button";
import { router } from "expo-router";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { VStack } from "@/components/ui/vstack";
import useStore from "@/store";

const Index = () => {
  const { getUser } = useStore();

  useEffect(() => {
    getUser()
  }, [])

  return (
      <SafeAreaView className="md:flex flex-col items-center justify-center md:w-full h-full">
        <VStack className="p-2 md:max-w-[440px] w-full" space="xl">
          <Button onPress={() => router.push("(tabs)")}>
            <ButtonText>Tabs</ButtonText>
          </Button>
          <Button onPress={() => router.push("auth/signin")}>
            <ButtonText>Sign In</ButtonText>
          </Button>
          <Button onPress={() => router.push("auth/signup")}>
            <ButtonText>Sign Up</ButtonText>
          </Button>
        </VStack>
      </SafeAreaView>
  );
};

export default Index;