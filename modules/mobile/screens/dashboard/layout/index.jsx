import {useState} from "react";
import {Box} from "@/components/ui/box";
import {VStack} from "@/components/ui/vstack";
import {HStack} from "@/components/ui/hstack";
import {SafeAreaView} from "@/components/ui/safe-area-view";
import {BarChartIcon} from "@/assets/icons/bar-chart";
import {BankTransferIcon} from "@/assets/icons/bank-transfer";
import {ProfileIcon} from "@/assets/icons/profile";
import {ShapeIcon} from "@/assets/icons/shape";
import MobileFooter from "./mobile-footer";
import MobileHeader from "./mobile-header";
import WebHeader from "./web-header";
import Sidebar from "./sidebar";

const bottomTabs = [
  {icon: BarChartIcon, text: 'Analytics', path: '/dashboard/analytics'},
  {icon: BankTransferIcon, text: 'Transactions', path: '/dashboard/transactions'},
  {icon: ShapeIcon, text: 'Categories', path: '/dashboard/categories'},
  {icon: ProfileIcon, text: 'Settings', path: '/dashboard/settings'}
]

const DashboardLayout = ({children, title, showSidebar = true}) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(showSidebar);

  return (
      <SafeAreaView className="w-full h-full">
        <VStack className="h-full w-full bg-background-0">
          <Box className="md:hidden">
            <MobileHeader title={title}/>
          </Box>
          <Box className="hidden md:flex">
            <WebHeader onSidebarToggle={() => setIsSidebarVisible(!isSidebarVisible)} title={title}/>
          </Box>
          <VStack className="h-full w-full">
            <HStack className="h-full w-full">
              <Box className="hidden md:flex h-full">
                {isSidebarVisible && <Sidebar tabs={bottomTabs}/>}
              </Box>
              <VStack className="w-full">{children}</VStack>
            </HStack>
          </VStack>
        </VStack>
        <MobileFooter tabs={bottomTabs}/>
      </SafeAreaView>
  );
};

export default DashboardLayout