import React, {useState} from 'react'
import {Pressable} from '@/components/ui/pressable'
import {Text} from '@/components/ui/text'
import {Input, InputSlot, InputField} from '@/components/ui/input'
import {HStack} from '@/components/ui/hstack'

const TagsInput = ({placeholder, value, onChangeText, onBlur, onSubmitEditing, size = 'md'}) => {
  const [currentTags, setCurrentTags] = useState(value || [])
  const [latestTag, setLatestTag] = useState('')

  const updateTags = (tags) => {
    setCurrentTags(tags)
    onChangeText(tags)
  }

  const handleTextChange = (text) => {
    if (text.includes(',')) {
      updateTags([...currentTags, ...text.split(',').map(t => t.trim()).filter(t => t.length > 0)])
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
      const tagToRemove = currentTags[currentTags.length - 1]
      removeTag(currentTags.length - 1)
      setLatestTag(tagToRemove)
    }
  }

  const handleSumit = (e) => {
    e.preventDefault()
    if (latestTag !== '') {
      updateTags([...currentTags, latestTag])
      setLatestTag('')
    }
    if (onSubmitEditing) {
      onSubmitEditing()
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
                      <Text className="rounded-lg px-1 border border-secondary-700 text-typography-700 text-md">
                        {t}
                      </Text>
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
            onKeyPress={(e) => handleKeyPress(e.nativeEvent.key)}
            autoCapitalize="none"
            autoCorrect="none"
            importantForAutofill="no"
            inputMode="text"
            textContentType="none"
        />
      </Input>
  )
}

export default TagsInput