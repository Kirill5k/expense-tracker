import React, {useRef, useState} from 'react'
import {Animated, Dimensions} from 'react-native'
import {HStack} from '@/components/ui/hstack'
import {Box} from '@/components/ui/box'
import {Input, InputField} from '@/components/ui/input'
import {MaterialIcon} from '@/components/ui/icon'
import {Button, ButtonIcon} from '@/components/ui/button'
import Colors from '@/constants/colors'

const ExpandableSearchInput = ({className, mode, onChange}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [value, setValue] = useState('')
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
      handleValueChange('')
    } else {
      inputRef.current.focus()
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
    outputRange: [38, screenWidth - 74],
  })

  return (
      <Box className={"bg-background-0 flex justify-end flex-row items-center " + className}>
        <HStack className="relative justify-end items-center">
          <Animated.View style={{overflow: 'hidden', width: inputWidth}}>
            <Input
                variant="rounded"
                size="md"
                className="bg-background-100 border-0"
            >
              <InputField
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
            </Input>
          </Animated.View>
          <Button
              variant="link"
              size="xs"
              onPress={toggleExpand}
              className="px-2 absolute"
          >
            <ButtonIcon as={MaterialIcon} code="magnify" dsize={24} dcolor={Colors[mode].text}/>
          </Button>
        </HStack>
      </Box>
  )
}

export default ExpandableSearchInput;