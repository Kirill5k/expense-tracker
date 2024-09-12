import {HStack} from "@/components/ui/hstack";
import {Pressable} from "@/components/ui/pressable";
import {MenuIcon, Icon} from "@/components/ui/icon";
import {Avatar, AvatarFallbackText,} from "@/components/ui/avatar";
import {Text} from "@/components/ui/text";

const WebHeader = ({title, onSidebarToggle}) => {
  return (
      <HStack className="pt-4  pr-10 pb-3 bg-background-0 items-center justify-between border-b border-border-300">
        <HStack className="items-center">
          <Pressable
              onPress={onSidebarToggle}
          >
            <Icon as={MenuIcon} size="lg" className="mx-5"/>
          </Pressable>
          <Text className="text-2xl">{title}</Text>
        </HStack>

        <Avatar className="h-9 w-9">
          <AvatarFallbackText className="font-light">A</AvatarFallbackText>
        </Avatar>
      </HStack>
  );
}

export default WebHeader