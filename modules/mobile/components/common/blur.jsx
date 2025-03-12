import {BlurView} from 'expo-blur'
import {StyleSheet} from 'react-native'

export const BlurredContainer = ({rounded = false, intensity = 90, children}) => {
  return (
      <BlurView
          // System chrome material automatically adapts to the system's theme
          // and matches the native tab bar appearance on iOS.
          tint="systemChromeMaterial"
          intensity={intensity}
          style={[styles.container, rounded && styles.rounded]}
      >
        {children}
      </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    ...StyleSheet.absoluteFill
  },
  rounded: {
    borderRadius: 12,
  }
});