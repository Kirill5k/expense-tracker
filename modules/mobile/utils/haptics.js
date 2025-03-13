import * as Haptics from 'expo-haptics'

export const lightImpact = () => {
  if (process.env.EXPO_OS === 'ios') {
    // Add a soft haptic feedback when pressing down on the tabs.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}