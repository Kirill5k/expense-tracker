import '@/global.css'
import 'react-native-reanimated'
import 'react-native-get-random-values'
import React, {useEffect} from 'react'
import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import {useFonts} from 'expo-font'
import {router, Stack} from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import {DatabaseProvider} from '@nozbe/watermelondb/react'
import {GluestackUIProvider} from '@/components/ui/gluestack-ui-provider'
import {useColorScheme} from '@/components/useColorScheme'
import {withToast} from '@/components/ui/toast'
import useStore from '@/store'
import database from '@/db'
import {initState} from '@/db/operations'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(dashboard)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav/>;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme()
  const {
    mode,
    setMode,
    user,
    alert,
    clearAlert,
    setErrorAlert,
    isAuthenticated,
    clearUser,
    getUser,
    getTransactions,
    reloadTransactions,
    setLoading,
  } = useStore()

  useEffect(() => {
    initState(database)
  }, []);

  useEffect(() => {
    if (user?.settings) {
      reloadTransactions()
    }
  }, [user?.settings?.currency, user?.settings?.futureTransactionVisibilityDays])

  useEffect(() => {
    if (user?.settings?.darkMode === true) {
      setMode('dark')
    } else if (user?.settings?.darkMode === false) {
      setMode('light')
    } else {
      setMode(colorScheme === ' dark' ? 'dark' : 'light')
    }
  }, [user?.settings?.darkMode])

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true)
      getUser()
          .then(getTransactions)
          .then(() => router.push("/analytics"))
          .catch(e => {
            setErrorAlert(e.message)
            clearUser()
          })
          .finally(() => setTimeout(() => setLoading(false), 1000))
    } else {
      router.push('/')
    }
  }, [isAuthenticated])

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
                  <Stack.Screen name="(dashboard)"/>
                  <Stack.Screen name="auth/signup"/>
                </StackWithToast>
              </DatabaseProvider>
            </ThemeProvider>
          </GluestackUIProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
  );
}

const StackWithToast = withToast(Stack)