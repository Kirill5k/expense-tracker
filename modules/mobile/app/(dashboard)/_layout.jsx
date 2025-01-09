import {useEffect, useRef} from 'react'
import {router, Tabs, usePathname} from 'expo-router'
import {SafeAreaView} from '@/components/ui/safe-area-view'
import Colors from '@/constants/colors'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {useColorScheme} from '@/components/useColorScheme'
import {FloatingButtonStack} from '@/components/common/floating-button'

const tabs = [
  {icon: 'chart-bar', text: 'Analytics', path: 'analytics'},
  {icon: 'bank-transfer', iconSize: 30, iconMarginBottom: -5, text: 'Transactions', path: 'transactions'},
  {icon: 'calendar-sync-outline', iconSize: 24, iconMarginBottom: -7, text: 'Recurring', path: 'recurrings'},
  {icon: 'shape', text: 'Categories', path: 'categories'},
  {icon: 'account-cog', text: 'Settings', path: 'settings'}
]

const floatingButtons = [
  {icon: 'shape', text: 'Category', onPress: () => router.push('category')},
  {icon: 'calendar-sync-outline', text: 'Recurring', onPress: () => router.push('recurring')},
  {icon: 'bank-transfer', text: 'Transaction', onPress: () => router.push('transaction')},
]

const DashboardLayout = () => {
  const floatingButtonRef = useRef(null)
  const mode = useColorScheme()
  const path = usePathname()

  console.log(path)

  useEffect(() => {
    floatingButtonRef?.current?.close()
  }, [path])

  return (
      <SafeAreaView className="w-full h-full bg-background-0">
        <Tabs
            screenOptions={{
              animation: 'shift',
              tabBarActiveTintColor: Colors[mode].text,
              // Disable the static render of the header on web
              // to prevent a hydration error in React Navigation v6.
              headerShown: false,
              tabBarStyle: {
                paddingTop: 5,
                backgroundColor: Colors[mode].backgroundColor,
                borderTopColor: Colors[mode].tabTopBorder,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                paddingBottom: 3,
                paddingTop: 3
              },
            }}
        >
          {tabs.map((tab, i) => (
              <Tabs.Screen
                  key={i}
                  name={tab.path}
                  options={{
                    title: tab.text,
                    tabBarIcon: ({color}) => (
                        <MaterialCommunityIcons
                            name={tab.icon}
                            size={tab.iconSize || 26}
                            style={{marginBottom: tab.iconMarginBottom || -3}}
                            color={color}
                        />
                    ),
                  }}
              />
          ))}
        </Tabs>
        {path !== '/settings' && (
            <FloatingButtonStack
                ref={floatingButtonRef}
                className="absolute bottom-[66px] right-4"
                mode={mode}
                buttons={floatingButtons}
            />
        )}
      </SafeAreaView>
  );
};

export default DashboardLayout