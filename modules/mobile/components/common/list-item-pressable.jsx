import React, {useState} from 'react'
import {Pressable} from '@/components/ui/pressable'
import {HStack} from '@/components/ui/hstack'
import {Button, ButtonIcon} from '@/components/ui/button'
import {MaterialIcon} from '@/components/ui/icon'
import Swipeable from 'react-native-gesture-handler/Swipeable'
import {Animated} from 'react-native'

const RightAction = ({onCopy, onDelete}) => (prog, drag) => {
  const withCopyButton = onCopy != null
  const trans = Animated.add(drag, new Animated.Value(withCopyButton ? 100 : 50));
  return (
      <Animated.View
          className={`rounded-r-xl bg-background-200 h-full ${withCopyButton ? 'w-28' : 'w-14'}`}
          style={{
            transform: [{translateX: trans}],
          }}
      >
        <HStack className="w-full h-full p-1" space="xs">
          {withCopyButton && (
              <Button size="sm" className="rounded-xl w-12 h-full p-0 bg-sky-500" action="positive" onPress={onCopy}>
                <ButtonIcon as={MaterialIcon} code="content-copy" dsize={16} dcolor="white" />
              </Button>
          )}
          <Button size="sm" className="rounded-xl w-12 h-full p-0 bg-red-500" action="negative" onPress={onDelete}>
            <ButtonIcon as={MaterialIcon} code="trash-can" dsize={16} dcolor="white" />
          </Button>
        </HStack>
      </Animated.View>
  );
}

const ListItemPressable = ({onPress, children, disabled, onCopy, onDelete}) => {
  const [isPressed, setIsPressed] = useState(false)
  return (
      <Swipeable
          overshootRight={false}
          friction={2}
          enableTrackpadTwoFingerGesture
          rightThreshold={40}
          renderRightActions={RightAction({onCopy, onDelete})}
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