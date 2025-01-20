import {useState, forwardRef, useImperativeHandle, useRef} from 'react'
import {Animated, StyleSheet, Platform} from 'react-native'
import {Box} from '@/components/ui/box'
import {VStack} from '@/components/ui/vstack'
import {Button, ButtonIcon} from '@/components/ui/button'
import {MaterialIcon} from '@/components/ui/icon'
import colors from '@/constants/colors'
import {mergeClasses} from '@/utils/css'

export const FloatingButtonStack = forwardRef(({mode, className, buttons}, ref) => {
  const [isOpen, setIsOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    close: () => setIsOpen(false)
  }))

  return (
      <VStack
          className={mergeClasses('', className)}
          space="md"
      >
        <Button
            size="lg"
            className="rounded-full px-2 h-14 w-14"
            onPress={() => setIsOpen(!isOpen)}
        >
          <ButtonIcon
              as={MaterialIcon}
              code={isOpen ? 'close' : 'plus'}
              dsize={28}
              dcolor={colors[mode].background}
          />
        </Button>
        {buttons.map((button) => isOpen && (
            <Button
                size="lg"
                className="rounded-full px-2 h-14 w-14 bg-background-700"
                key={button.icon}
                onPress={() => {
                  setIsOpen(false)
                  button.onPress()
                }}
            >
              <ButtonIcon
                  as={MaterialIcon}
                  code={button.icon}
                  dsize={26}
                  dcolor={colors[mode].background}
              />
            </Button>
        ))}
      </VStack>
  )
})

const FloatingButton = ({mode, buttons = [], radius = 75}) => {
  const [isOpen, setIsOpen] = useState(false)
  const animation = useRef(new Animated.Value(0)).current

  const handlePress = () => {
    const toValue = isOpen ? 0 : 1;

    Animated.spring(animation, {
      toValue,
      friction: 6,
      useNativeDriver: true,
    }).start()

    setIsOpen(!isOpen)
  }

  const rotateInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg']
  })

  return (
      <Box className="absolute bottom-4 right-4 items-center justify-center">
        {buttons.map((button, i) => {
          const angle = -Math.PI - 0.1 + (i * Math.PI * 0.56) / (buttons.length - 1)

          const translateX = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, radius * Math.cos(angle)],
          })

          const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, radius * Math.sin(angle)],
          })

          const scale = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          })

          const opacity = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          })

          return (
              <Animated.View
                  key={i}
                  className="absolute w-14 h-14"
                  style={{
                    transform: [{translateX}, {translateY}, {scale}],
                    opacity,
                  }}
              >
                <Button
                    size="lg"
                    className="rounded-full px-2 h-14 w-14"
                    key={button.icon}
                    onPress={() => {
                      handlePress()
                      button.onPress()
                    }}
                    style={[styles.floating]}
                >
                  <ButtonIcon
                      as={MaterialIcon}
                      code={button.icon}
                      dsize={26}
                      dcolor={colors[mode].background}
                  />
                </Button>
              </Animated.View>
          )
        })}
        <Animated.View
            style={{
              transform: [{rotate: rotateInterpolate}]
            }}
        >
          <Button
              onPress={handlePress}
              size="lg"
              className="rounded-full px-2 h-14 w-14"
              style={[styles.floating]}
          >
            <ButtonIcon
                as={MaterialIcon}
                code={'plus'}
                dsize={28}
                dcolor={colors[mode].background}
            />
          </Button>
        </Animated.View>
      </Box>
  )
}

const styles = StyleSheet.create({
  floating: {
    opacity: 0.95,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.6,
    shadowRadius: 3.65,
    // Android shadow
    elevation: 8,
  },
})

export default FloatingButton