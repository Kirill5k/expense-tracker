import React, {useState} from 'react'
import {Pressable} from '@/components/ui/pressable'
import {HStack} from '@/components/ui/hstack'
import {Button, ButtonIcon} from '@/components/ui/button'
import {MaterialIcon} from '@/components/ui/icon'
import Swipeable from 'react-native-gesture-handler/Swipeable'
import {Text, Animated} from 'react-native'

function LegacyRightAction(prog, drag) {
  const trans = Animated.add(drag, new Animated.Value(50));

  return (
      <Animated.View
          className="rounded-r-xl bg-background-200 w-14 h-full"
          style={{
            transform: [{translateX: trans}],
          }}
      >
        <HStack className="w-full h-full p-1">
          <Button size="sm" className="rounded-xl w-12 h-full p-0 bg-red-500" action="negative">
            {/* EditIcon is imported from 'lucide-react-native' */}
            <ButtonIcon as={MaterialIcon} code="trash-can" dsize={24} dcolor="white" />
          </Button>
        </HStack>
      </Animated.View>
  );
}

const ListItemPressable = ({onPress, children, disabled}) => {
  const [isPressed, setIsPressed] = useState(false)
  return (
      <Swipeable
          overshootRight={false}
          friction={2}
          enableTrackpadTwoFingerGesture
          rightThreshold={40}
          renderRightActions={LegacyRightAction}
      >
        <Pressable
            disabled={disabled}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            className={`rounded-xl hover:bg-background-100 ${isPressed ? 'bg-background-200' : ''}`}
            onPress={onPress}
        >
          {children}
        </Pressable>
      </Swipeable>
  )
}

export default ListItemPressable