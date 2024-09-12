import {router, usePathname} from "expo-router";
import {VStack} from "@/components/ui/vstack";
import {Pressable} from "@/components/ui/pressable";
import {Icon} from "@/components/ui/icon";

const Sidebar = ({tabs}) => {
  const pathname = usePathname()

  const isActive = (tab) => tab.path === pathname

  return (
      <VStack
          className="w-14 pt-5 h-full items-center border-r border-border-300"
          space="xl"
      >
        {tabs.map((tab, index) => (
                <Pressable
                    key={index}
                    className="hover:bg-background-50"
                    onPress={() => router.push(tab.path)}
                >
                  <Icon
                      as={tab.icon}
                      className={`w-[55px] h-9 ${isActive(tab) ? 'text-typography-900 stroke-background-900' : 'text-typography-400 stroke-background-400'}`}
                  />
                </Pressable>
            )
        )}
      </VStack>
  );
};

export default Sidebar