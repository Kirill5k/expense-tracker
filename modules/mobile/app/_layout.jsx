import FontAwesome from '@expo/vector-icons/FontAwesome';
import "@/global.css";
import {GluestackUIProvider} from "@/components/ui/gluestack-ui-provider";
import {Toast, ToastTitle, useToast} from "@/components/ui/toast";
import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {useFonts} from 'expo-font';
import {Stack} from 'expo-router';
import {useEffect, useState} from 'react';
import * as SplashScreen from 'expo-splash-screen';
import useStore from "@/store";
import 'react-native-reanimated';

import {useColorScheme} from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === ' dark'

  const { alert, clearAlert } = useStore();
  const [toastId, setToastId] = useState(0)
  const toast = useToast();

  useEffect(() => {
    console.log('useEffect-toas', alert)
    if (alert) {
      const newId = Math.random()
      setToastId(newId)
      toast.show({
        duration: 3000,
        id: newId,
        placement: "bottom",
        render: ({id}) => (
            <Toast nativeID={"toast-" + id} variant="accent" action={alert.type}>
              <ToastTitle>{alert.message}</ToastTitle>
            </Toast>
        ),
        onCloseComplete: () => {
          console.log('clearing alert')
          clearAlert()
        },
      });
    }
  }, [alert]);

  return (
    <GluestackUIProvider mode={isDark ? 'dark' : 'light'}>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{headerShown: false}}>
          <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
          <Stack.Screen name="modal" options={{presentation: 'modal'}}/>
          <Stack.Screen name="auth/signin" />
          <Stack.Screen name="auth/signup" />
          <Stack.Screen name="auth/forgot-password" />
        </Stack>
      </ThemeProvider>
    </GluestackUIProvider>
  );
}