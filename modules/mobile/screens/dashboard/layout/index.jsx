import {SafeAreaView} from "@/components/ui/safe-area-view";
import {useColorScheme} from '@/components/useColorScheme';
import colors from '@/constants/colors';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {Tabs} from 'expo-router';
import React from "react";

const tabs = [
  {icon: 'chart-bar', text: 'Analytics', path: 'index'},
  {icon: 'bank-transfer', text: 'Transactions', path: 'transactions'},
  {icon: 'shape', text: 'Categories', path: 'categories'},
  {icon: 'account-cog', text: 'Settings', path: 'settings'}
]

/* OLD LAYOUT
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
 */

const DashboardLayout = () => {
  const colorScheme = useColorScheme();

  return (
      <SafeAreaView className="w-full h-full">
        <Tabs
            screenOptions={{
              tabBarActiveTintColor: colors[colorScheme || 'light'].text,
              // Disable the static render of the header on web
              // to prevent a hydration error in React Navigation v6.
              headerShown: false,
              tabBarStyle: { marginBottom: 5 }
            }}
        >
          {tabs.map((tab, i) => (
              <Tabs.Screen
                  key={i}
                  name={tab.path}
                  options={{
                    title: tab.text,
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons
                            name={tab.icon}
                            size={28}
                            style={{ marginBottom: -3 }}
                            color={color}
                        />
                    ),
                  }}
              />
          ))}
        </Tabs>
      </SafeAreaView>
  );
};

export default DashboardLayout