import React, {useState} from 'react'
import {Pressable} from '@/components/ui/pressable'
import {Text} from '@/components/ui/text'
import {Input, InputSlot, InputField} from '@/components/ui/input'
import {HStack} from "../ui/hstack";

const TagsInput = ({placeholder, value, onChangeText, onBlur, size = 'sm'}) => {
  const [currentTags, setCurrentTags] = useState(value || [])
  const [latestTag, setLatestTag] = useState('')

  const updateTags = (tags) => {
    setCurrentTags(tags)
    onChangeText(tags)
  }

  const handleTextChange = (text) => {
    if (text.includes(',')) {
      updateTags([...currentTags, ...text.split(',').filter(t => t.length > 0)])
      setLatestTag('')
    } else {
      setLatestTag(text)
    }
  }

  const removeTag = (indexToRemove) => {
    updateTags([...currentTags.slice(0, indexToRemove), ...currentTags.slice(indexToRemove + 1)])
  }

  const handleKeyPress = (key) => {
    if (key === 'Backspace' && latestTag === '') {
      removeTag(currentTags.length - 1)
    }
  }

  const handleSumit = (e) => {
    e.preventDefault()
    if (latestTag !== '') {
      updateTags([...currentTags, latestTag])
      setLatestTag('')
    }
  }

  return (
      <Input
          variant="outline"
          size={size}
          className="pl-2"
      >
        {currentTags?.length > 0 && (
            <InputSlot>
              <HStack className="pl-2" space="xs">
                {currentTags.map((t, i) => (
                    <Pressable key={i} onPress={() => removeTag(i)}>
                      <Text
                          className="rounded-lg px-1 border border-secondary-300 text-typography-700 text-2xs">{t}</Text>
                    </Pressable>
                ))}
              </HStack>
            </InputSlot>
        )}
        <InputField
            placeholder={currentTags.length > 0 ? '' : placeholder}
            value={latestTag}
            onChangeText={handleTextChange}
            onBlur={onBlur}
            onSubmitEditing={handleSumit}
            returnKeyType="done"
            autoComplete="off"
            textContentType="none"
            onKeyPress={(e) => handleKeyPress(e.nativeEvent.key)}
            autoCapitalize="none"
            autoCorrect="none"
            importantForAutofill="no"
            inputMode="text"
        />
      </Input>
  )
}

export default TagsInput