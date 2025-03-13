import {PlatformPressable} from '@react-navigation/elements'
import {lightImpact} from '@/utils/haptics'

export const HapticsTab = (props) => {
  return (
      <PlatformPressable
          {...props}
          onPressIn={(ev) => {
            lightImpact()
            props.onPressIn?.(ev);
          }}
      />
  );
}
