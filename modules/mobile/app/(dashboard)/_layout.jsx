import {Tabs} from 'expo-router'
import {SafeAreaView} from '@/components/ui/safe-area-view'
import Colors from '@/constants/colors'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import {useColorScheme} from '@/components/useColorScheme'

const tabs = [
  {icon: 'chart-bar', text: 'Analytics', path: 'analytics'},
  {icon: 'bank-transfer', iconSize: 30, text: 'Transactions', path: 'transactions'},
  {icon: 'calendar-sync-outline', text: 'Recurring', path: 'recurring'},
  {icon: 'shape', text: 'Categories', path: 'categories'},
  {icon: 'account-cog', text: 'Settings', path: 'settings'}
]

const DashboardLayout = () => {
  const mode = useColorScheme()

  return (
      <SafeAreaView className="w-full h-full bg-background-0">
        <Tabs
            screenOptions={{
              tabBarActiveTintColor: Colors[mode].text,
              // Disable the static render of the header on web
              // to prevent a hydration error in React Navigation v6.
              headerShown: false,
              tabBarStyle: {
                paddingTop: 5,
                backgroundColor: Colors[mode].backgroundColor,
                borderTopColor: Colors[mode].tabTopBorder,
              },
              tabBarLabelStyle: { fontSize: 12, paddingBottom: 3, paddingTop: 3 },
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
                            size={tab.iconSize || 26}
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