import {Tabs} from 'expo-router'
import {SafeAreaView} from '@/components/ui/safe-area-view'
import Colors from '@/constants/colors'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {useColorScheme} from '@/components/useColorScheme'

const tabs = [
  {icon: 'chart-bar', text: 'Analytics', path: 'analytics'},
  {icon: 'bank-transfer', iconSize: 30, iconMarginBottom: -4, text: 'Transactions', path: 'transactions'},
  {icon: 'calendar-sync-outline', iconSize: 23, iconMarginBottom: -2, text: 'Recurring', path: 'recurrings'},
  {icon: 'shape', text: 'Categories', iconMarginBottom: 0, path: 'categories'},
  {icon: 'account-cog', text: 'Settings', iconSize: 28, iconMarginBottom: -2, path: 'settings'}
]

const DashboardLayout = () => {
  const mode = useColorScheme() || 'light'
  return (
      <SafeAreaView className="w-full h-full bg-background-0">
        <Tabs
            screenOptions={{
              tabBarActiveTintColor: Colors[mode].text,
              // Disable the static render of the header on web
              // to prevent a hydration error in React Navigation v6.
              headerShown: false,
              tabBarStyle: {
                backgroundColor: Colors[mode].backgroundColor,
                borderTopColor: Colors[mode].tabTopBorder,
              },
              tabBarLabelStyle: {
                fontSize: 10,
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
                            style={{marginBottom: tab.iconMarginBottom || 0}}
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