import {Tabs} from 'expo-router'
import {SafeAreaView} from '@/components/ui/safe-area-view'
import colors from '@/constants/colors'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import useStore from '@/store'

const tabs = [
  {icon: 'chart-bar', text: 'Analytics', path: 'analytics'},
  {icon: 'bank-transfer', text: 'Transactions', path: 'transactions'},
  {icon: 'shape', text: 'Categories', path: 'categories'},
  {icon: 'account-cog', text: 'Settings', path: 'settings'}
]

const DashboardLayout = () => {
  const {mode} = useStore()

  return (
      <SafeAreaView className="w-full h-full bg-background-0">
        <Tabs
            screenOptions={{
              tabBarActiveTintColor: colors[mode].text,
              // Disable the static render of the header on web
              // to prevent a hydration error in React Navigation v6.
              headerShown: false,
              tabBarStyle: { paddingBottom: 5 }
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