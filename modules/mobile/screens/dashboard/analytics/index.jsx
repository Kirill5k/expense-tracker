import {VStack} from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { ScrollView } from "@/components/ui/scroll-view";

export const Analytics = () => {
  return (
      <VStack
          className="p-4 pb-0 md:px-10 md:pt-6 md:pb-0 h-full w-full max-w-[1500px] self-center  mb-20 md:mb-2"
          space="2xl"
      >
        <Heading size="2xl" className="font-roboto">
          Analytics
        </Heading>
      </VStack>
  )
}
