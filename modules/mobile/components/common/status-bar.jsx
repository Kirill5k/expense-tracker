import {StatusBar} from 'expo-status-bar'
import {Box} from '@/components/ui/box'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

export const StatusBarWithBackground = ({mode}) => {
  const insets = useSafeAreaInsets()

  return (
      <Box className="bg-background-0" style={{height: insets.top }}>
        <StatusBar
            style={mode === 'dark' ? 'light' : 'dark'}
            barStyle="dark-content"
        />
      </Box>
  )
}