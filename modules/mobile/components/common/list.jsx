import React, {useState} from 'react'
import {Avatar} from '@/components/ui/avatar'
import {MaterialIcon} from '@/components/ui/icon'
import {Pressable} from '@/components/ui/pressable'
import {Button, ButtonIcon} from '@/components/ui/button'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import Animated, {useAnimatedStyle} from 'react-native-reanimated'


// Right swipe action buttons (copy/delete) with progressive reveal
const RightActionsContainer = ({progress, withCopyButton, onCopy, onDelete, swipeableRef}) => {
  const buttonWidth = 48
  const gap = withCopyButton ? 4 : 0
  const width = withCopyButton ? buttonWidth * 2 + gap : buttonWidth

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress?.value ?? 0
    return {
      transform: [{translateX: (1 - p) * width}], // slide in from right
      opacity: p < 0.25 ? (p / 0.25) * 0.6 : 0.6 + ((p - 0.25) / 0.75) * 0.4,
    }
  }, [withCopyButton])

  return (
      <Animated.View
          style={{
            width,
            height: '100%',
            flexDirection: 'row',
            backgroundColor: '#262626',
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12,
            justifyContent: 'flex-end',
            alignItems: 'stretch',
            paddingRight: 4,
            gap: 4,
            overflow: 'hidden',
          }}
      >
        <Animated.View style={[{flexDirection: 'row', gap: 4, height: '100%'}, animatedStyle]}>
          {withCopyButton && (
              <Button
                  size="sm"
                  accessibilityLabel="Copy"
                  className="rounded-xl w-12 h-full p-0 bg-sky-500"
                  action="positive"
                  onPress={() => {
                    onCopy()
                    swipeableRef?.current?.close()
                  }}
              >
                <ButtonIcon as={MaterialIcon} code="content-copy" dsize={20} dcolor="white" />
              </Button>
          )}
          <Button
              size="sm"
              accessibilityLabel="Delete"
              className="rounded-xl w-12 h-full p-0 bg-red-500"
              action="negative"
              onPress={() => {
                onDelete()
                swipeableRef?.current?.close()
              }}
          >
            <ButtonIcon as={MaterialIcon} code="trash-can" dsize={20} dcolor="white" />
          </Button>
        </Animated.View>
      </Animated.View>
  )
}

const RightAction = ({onCopy, onDelete, swipeableRef}) => (progress /* shared value */) => {
  const withCopyButton = onCopy != null
  return (
      <RightActionsContainer
          progress={progress}
          withCopyButton={withCopyButton}
          onCopy={onCopy}
          onDelete={onDelete}
          swipeableRef={swipeableRef}
      />
  )
}

export const ListItemPressable = ({onPress, children, disabled, onCopy, onDelete}) => {
  const ref = React.useRef(null)
  const [isPressed, setIsPressed] = useState(false)
  const [isSwiped, setIsSwiped] = useState(false)

  const handleSwipeableWillOpen = () => {
    if (!isSwiped) {
      setIsSwiped(true)
    }
  }

  return (
      <Swipeable
          ref={ref}
          overshootRight={false}
          friction={2}
          enableTrackpadTwoFingerGesture
          rightThreshold={40}
          renderRightActions={RightAction({onCopy, onDelete, swipeableRef: ref})}
          onSwipeableWillOpen={handleSwipeableWillOpen}
          onSwipeableClose={() => setIsSwiped(false)}
      >
        <Pressable
            disabled={disabled || isSwiped}
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

export const ListItemIcon = ({icon, color}) => {
  return (
      <Avatar size="md" className="mr-4" style={{backgroundColor: color}}>
        <MaterialIcon
            code={icon}
            dsize={28}
            dcolor="white"
        />
      </Avatar>
  )
}