import '@/global.css'
import 'react-native-reanimated'
import 'react-native-get-random-values'
import React, {useEffect, useState} from 'react'
import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {useNetInfo} from '@react-native-community/netinfo'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import {useFonts} from 'expo-font'
import {Stack} from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import {DatabaseProvider} from '@nozbe/watermelondb/react'
import {GluestackUIProvider} from '@/components/ui/gluestack-ui-provider'
import {withToast} from '@/components/ui/toast'
import useStore from '@/store'
import database from '@/db'
import {initSync} from '@/db/sync'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router'

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(dashboard)',
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  })

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return <RootLayoutNav/>
}

function RootLayoutNav() {
  const [intervalId, setIntervalId] = useState(null)
  const {mode, alert, clearAlert, accessToken} = useStore()
  const {type, isConnected, isInternetReachable} = useNetInfo()

  useEffect(() => {
    const syncDb = () => {
      if (isConnected && isInternetReachable) {
        initSync(database, accessToken)
      }
    }

    if (accessToken) {
      syncDb()
      const intervalId = setInterval(syncDb, 180000) // 3 minutes
      setIntervalId(intervalId)
    } else if (intervalId) {
      console.log('stopping db sync')
      clearInterval(intervalId)
      setIntervalId(null)
    }

    return () => intervalId ? clearInterval(intervalId) : true
  }, [accessToken]);

  return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{flex: 1}}>
          <GluestackUIProvider mode={mode}>
            <ThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
              <DatabaseProvider database={database}>
                <StackWithToast
                    screenOptions={{headerShown: false}}
                    onToastClose={clearAlert}
                    notification={alert}
                >
                  <Stack.Screen
                      name="index"
                  />
                  <Stack.Screen
                      name="auth/signin"
                  />
                  <Stack.Screen
                      name="auth/signup"
                  />
                  <Stack.Screen
                      name="(dashboard)"
                      options={{
                        gestureEnabled: false, // Disable the swipe back gesture
                      }}
                  />
                </StackWithToast>
              </DatabaseProvider>
            </ThemeProvider>
          </GluestackUIProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
  )
}

const StackWithToast = withToast(Stack)