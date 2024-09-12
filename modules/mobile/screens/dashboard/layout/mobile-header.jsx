import {router} from "expo-router";
import {HStack} from "@/components/ui/hstack";
import {Pressable} from "@/components/ui/pressable";
import {ChevronLeftIcon, Icon} from "@/components/ui/icon";
import {Text} from "@/components/ui/text";

const MobileHeader = ({title}) => {
  return (
      <HStack
          className="py-6 px-4 border-b border-border-50 bg-background-0 items-center"
          space="md"
      >
        <Pressable
            onPress={() => {
              router.back()
            }}
        >
          <Icon as={ChevronLeftIcon}/>
        </Pressable>
        <Text className="text-xl">{title}</Text>
      </HStack>
  );
}

export default MobileHeader