import FontAwesome from '@expo/vector-icons/FontAwesome';
import "@/global.css";
import {GluestackUIProvider} from "@/components/ui/gluestack-ui-provider";
import {withToast} from "@/components/ui/toast";
import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {useFonts} from 'expo-font';
import {Stack} from 'expo-router';
import {useEffect} from 'react';
import * as SplashScreen from 'expo-splash-screen';
import useStore from "@/store";
import 'react-native-reanimated';
import {categories, transactions} from "./test-data";

import {useColorScheme} from '@/components/useColorScheme';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === ' dark'
  const { alert, clearAlert, setCategories, setTransactions } = useStore();

  useEffect(() => {
    setCategories(categories)
    setTransactions(transactions)
  }, []);

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