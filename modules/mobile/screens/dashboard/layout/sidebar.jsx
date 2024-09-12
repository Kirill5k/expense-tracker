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
                    className={`hover:bg-background-50 text-typography-500 m-2 p-2 w-12 h-12}`}
                    onPress={() => router.push(tab.path)}
                >
                  <Icon
                      as={tab.icon}
                      className={`w-[55px] h-9 stroke-background-800 ${isActive(tab) ? "fill-background-800" : "fill-none"}`}
                  />
                </Pressable>
            )
        )}
      </VStack>
  );
};

export default Sidebar