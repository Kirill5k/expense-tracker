import '@/global.css'
import 'react-native-reanimated'
import React, {useEffect, useState} from 'react'
import {AppState} from 'react-native'
import {useLocales} from 'expo-localization'
import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {useFonts} from 'expo-font'
import {Stack} from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import {DatabaseProvider} from '@nozbe/watermelondb/react'
import {GluestackUIProvider} from '@/components/ui/gluestack-ui-provider'
import {withToast} from '@/components/ui/toast'
import useStore from '@/store'
import database from '@/db'
import {createRecurringTransactionInstancesWithTodayDate} from '@/db/operations'
import {initSync} from '@/db/sync'

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf')
  })

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
  const [appState, setAppState] = useState(AppState.currentState)
  const {mode, alert, clearAlert, accessToken, setLocale} = useStore()
  const locales = useLocales()

  const syncDb = () => {
    console.log('Initiating db sync')
    initSync(database)
  }

  useEffect(() => {
    if (accessToken) {
      syncDb()
    }
  }, [accessToken])

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground')
        syncDb()
        createRecurringTransactionInstancesWithTodayDate(database)
      }

      if (nextAppState === 'background') {
        console.log('App has gone to the background')
        syncDb()
      }

      setAppState(nextAppState)
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => subscription.remove()
  }, [appState])

  useEffect(() => {
    if (locales?.length) {
      setLocale(locales[0])
    }
  }, [locales]);

  useEffect(() => {
    createRecurringTransactionInstancesWithTodayDate(database)
  }, [])

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