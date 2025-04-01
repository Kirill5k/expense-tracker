import {BlurView} from 'expo-blur'
import {StyleSheet} from 'react-native'

export const BlurredBackground = ({
  style = {},
  rounded = false,
  intensity = 90,
  borderRadius = 12,
  children
}) => {

  return (
      <BlurView
          // System chrome material automatically adapts to the system's theme
          // and matches the native tab bar appearance on iOS.
          tint="systemChromeMaterial"
          intensity={intensity}
          style={[styles.container, rounded && {borderRadius}, style]}
      >
        {children}
      </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    ...StyleSheet.absoluteFill
  }
});