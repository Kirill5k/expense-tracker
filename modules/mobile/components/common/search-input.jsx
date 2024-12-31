import React, {useRef, useState} from 'react'
import {Animated, Dimensions} from 'react-native'
import {Pressable} from '@/components/ui/pressable'
import {Box} from '@/components/ui/box'
import {Input, InputField, InputSlot, InputIcon} from '@/components/ui/input'
import {MaterialIcon} from '@/components/ui/icon'
import Colors from '@/constants/colors'

const ExpandableSearchInput = ({className, mode, onChange}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [value, setValue] = useState('')
  const animation = useRef(new Animated.Value(0)).current
  const inputRef = useRef(null)
  const screenWidth = Dimensions.get('window').width

  const toggleExpand = () => {
    if (isExpanded) {
      handleClose()
    } else {
      handleExpand()
    }
  }

  const handleValueChange = (v) => {
    setValue(v)
    if (onChange) {
      onChange(v)
    }
  }

  const inputWidth = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [38, screenWidth - 77],
  })

  const handleExpand = () => {
    setIsExpanded(true)
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start()
    setTimeout(() => inputRef.current.focus())
  }

  const handleClose = () => {
    setIsExpanded(false)
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      handleValueChange('')
    })
  }

  return (
      <Box className={"bg-background-0 flex justify-end flex-row items-center " + className}>
        <Animated.View style={{overflow: 'hidden', width: inputWidth}}>
          <Input
              variant="rounded"
              size="md"
              className="bg-background-100 border-0 relative"
          >
            <InputSlot className="ml-2">
              <Pressable onPress={toggleExpand}>
                <InputIcon
                    as={MaterialIcon}
                    code="magnify"
                    dsize={24}
                    dcolor={Colors[mode].text}
                />
              </Pressable>
            </InputSlot>
            <InputField
                editable={isExpanded}
                clearButtonMode="never"
                value={value}
                onChangeText={handleValueChange}
                ref={inputRef}
                autoFocus={isExpanded}
                placeholder={isExpanded ? 'Type to search...' : ''}
                importantForAutofill="no"
                inputMode="search"
                autoComplete="off"
                returnKeyType="search"
                autoCorrect={false}
            />
            <Pressable
                className="right-2"
                onPress={toggleExpand}
            >
              <InputIcon
                  as={MaterialIcon}
                  code="close"
                  dsize={24}
                  dcolor={Colors[mode].text}
              />
            </Pressable>
          </Input>
        </Animated.View>
      </Box>
  )
}

export default ExpandableSearchInput;