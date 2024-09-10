import { VStack } from "@/components/ui/vstack";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { ScrollView } from "@/components/ui/scroll-view";

export const AuthLayout = (props) => {
  return (
      <SafeAreaView className="w-full h-full">
        <ScrollView
            className="w-full h-full"
            contentContainerStyle={{ flexGrow: 1 }}
        >
          <VStack className="md:items-center md:justify-center flex-1 w-full  p-9 md:gap-10 gap-16 md:m-auto md:w-1/2 h-full">
            {props.children}
          </VStack>
        </ScrollView>
      </SafeAreaView>
  );
};