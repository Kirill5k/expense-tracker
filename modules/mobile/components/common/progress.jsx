import * as Progress from "react-native-progress";
import Colors from '@/constants/colors'
import React from "react";

export const ProgressBar = ({className, mode}) => {
  return (
      <Progress.Bar
          className={className}
          height={7}
          animationType="spring"
          borderRadius={0}
          borderWidth={0}
          indeterminateAnimationDuration={1000}
          width={null}
          indeterminate={true}
          color={Colors[mode].progressMain}
          unfilledColor={Colors[mode].progressBackground}
          borderColor={Colors[mode].progressBackground}
      />
  )
}

export const ProgressCircle = ({className, mode}) => {
  return (
      <Progress.CircleSnail
          className={className}
          direction="clockwise"
          strokeCap="butt"
          thickness={10}
          size={125}
          indeterminate={true}
          borderWidth={0}
          color={[Colors[mode].progressMain, Colors[mode].progressBackground]}
          unfilledColor={Colors[mode].progressBackground}
          borderColor={Colors[mode].progressBackground}
      />
  )
}
