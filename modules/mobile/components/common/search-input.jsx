import React, { useRef, useState } from 'react'
import { Animated, Dimensions } from 'react-native'
import {HStack} from '@/components/ui/hstack'
import {Box} from '@/components/ui/box'
import {Input, InputField} from '@/components/ui/input'
import {MaterialIcon} from '@/components/ui/icon'
import {Button, ButtonIcon} from '@/components/ui/button'
import Colors from '@/constants/colors'

const ExpandableSearchInput = ({onClose, onExpand, className, mode}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const animation = useRef(new Animated.Value(0)).current
  const inputRef = useRef(null)
  const screenWidth = Dimensions.get('window').width

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
    Animated.timing(animation, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start()
    if (isExpanded) {
      inputRef.current.blur()
      if (onClose) {
        onClose()
      }
    } else {
      inputRef.current.focus()
      if (onExpand) {
        onExpand()
      }
    }
  }

  const inputWidth = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [34, screenWidth - 26], // Adjust the final width as needed
  })

  return (
      <Box className={"flex justify-end flex-row items-center " + className }>
        <HStack className="relative justify-end items-center">
          <Animated.View style={{overflow: 'hidden', width: inputWidth }}>
            <Input
                variant="rounded"
                size="sm"
            >
              <InputField
                  ref={inputRef}
                  autoFocus={isExpanded}
                  placeholder={isExpanded ? 'Enter Text here...' : ''}
              />
            </Input>
          </Animated.View>
          <Button
              variant="link"
              size="xs"
              onPress={toggleExpand}
              className="px-2 absolute"
          >
            <ButtonIcon as={MaterialIcon} code="magnify" dsize={20} dcolor={Colors[mode].text} />
          </Button>
        </HStack>
      </Box>
  )
}

export default ExpandableSearchInput;