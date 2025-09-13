import React, {useState} from 'react'
import {Avatar} from '@/components/ui/avatar'
import {MaterialIcon} from '@/components/ui/icon'
import {Pressable} from '@/components/ui/pressable'
import {Button, ButtonIcon} from '@/components/ui/button'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import Animated, {useAnimatedStyle} from 'react-native-reanimated'


// Constants
const ACTION_BTN_WIDTH = 48
const ACTION_GAP = 4

// Progressive reveal action buttons (slides from right, fades in)
const RightActions = ({progress, showCopy, onCopy, onDelete, swipeableRef}) => {
  const totalWidth = showCopy ? ACTION_BTN_WIDTH * 2 + ACTION_GAP : ACTION_BTN_WIDTH

  const animatedRowStyle = useAnimatedStyle(() => {
    const p = progress?.value ?? 0 // shared value (0 -> 1)
    return {
      transform: [{translateX: (1 - p) * totalWidth}],
      opacity: 0.4 + 0.6 * p, // simple linear fade
    }
  }, [showCopy])

  return (
      <Animated.View
          style={{
            width: totalWidth,
            height: '100%',
            flexDirection: 'row',
            backgroundColor: '#262626',
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12,
            justifyContent: 'flex-end',
            alignItems: 'stretch',
            paddingRight: 0,
            overflow: 'hidden'
          }}
      >
        <Animated.View style={[{flexDirection: 'row', height: '100%'}, animatedRowStyle]}>
          {showCopy && (
              <Button
                  size="sm"
                  accessibilityLabel="Copy"
                  className="rounded-xl w-12 h-full p-0 bg-sky-500"
                  style={{marginRight: ACTION_GAP}}
                  action="positive"
                  onPress={() => {
                    onCopy?.()
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
                onDelete?.()
                swipeableRef?.current?.close()
              }}
          >
            <ButtonIcon as={MaterialIcon} code="trash-can" dsize={20} dcolor="white" />
          </Button>
        </Animated.View>
      </Animated.View>
  )
}

// Factory passed to Swipeable
const buildRightActionsRenderer = ({onCopy, onDelete, swipeableRef}) => (progress /* shared value */) => (
    <RightActions
        progress={progress}
        showCopy={onCopy != null}
        onCopy={onCopy}
        onDelete={onDelete}
        swipeableRef={swipeableRef}
    />
)

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
          renderRightActions={buildRightActionsRenderer({onCopy, onDelete, swipeableRef: ref})}
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