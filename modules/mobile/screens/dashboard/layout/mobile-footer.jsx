import {router, usePathname} from "expo-router"
import {HStack} from "@/components/ui/hstack";
import {Pressable} from "@/components/ui/pressable";
import {Icon} from "@/components/ui/icon";
import {Text} from "@/components/ui/text";
import {cn} from "@gluestack-ui/nativewind-utils/cn";
import {Platform} from "react-native";

const MobileFooter = ({tabs}) => {
  const pathname = usePathname()

  const isActive = (tab) => tab.path === pathname

  return (
      <HStack
          className={cn(
              "bg-background-0 justify-between w-full absolute left-0 bottom-0 right-0 p-3 overflow-hidden items-center  border-t-border-300  md:hidden border-t",
              {"pb-5": Platform.OS === "ios"},
              {"pb-5": Platform.OS === "android"}
          )}
      >
        {tabs.map((tab, index) => {
              return (
                  <Pressable
                      className="px-0.5 flex-1 flex-col items-center"
                      key={index}
                      onPress={() => router.push(tab.path)}
                  >
                    <Icon
                        as={tab.icon}
                        size="xl"
                        className={isActive(tab) ? 'text-typography-1000' : 'text-typography-400'}
                    />
                    <Text
                        className={`text-xs text-center ${isActive(tab) ? 'text-typography-1000' : 'text-typography-400'}`}>
                      {tab.text}
                    </Text>
                  </Pressable>
              );
            }
        )}
      </HStack>
  );
}

export default MobileFooter