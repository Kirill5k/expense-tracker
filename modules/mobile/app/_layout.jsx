import '@/global.css'
import 'react-native-reanimated'
import React, {useEffect} from 'react'
import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import {useFonts} from 'expo-font'
import {router, Stack} from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import {GluestackUIProvider} from '@/components/ui/gluestack-ui-provider'
import {useColorScheme} from '@/components/useColorScheme'
import {withToast} from '@/components/ui/toast'
import useStore from '@/store'

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
  const isDark = colorScheme === ' dark'
  const {
    alert,
    clearAlert,
    setErrorAlert,
    accessToken,
    clearUser,
    getUser,
    getTransactions,
    setLoading,
  } = useStore()

  useEffect(() => {
    if (accessToken != null) {
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
  }, [accessToken])

  return (
      <GluestackUIProvider mode={isDark ? 'dark' : 'light'}>
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
          <StackWithToast
              screenOptions={{headerShown: false}}
              onToastClose={clearAlert}
              toastType={alert?.type}
              toastMessage={alert?.message}
          >
            <Stack.Screen name="(dashboard)"/>
            <Stack.Screen name="auth/signup"/>
          </StackWithToast>
        </ThemeProvider>
      </GluestackUIProvider>
  );
}

const StackWithToast = withToast(Stack)