import React, {useState} from 'react'
import {MaterialIcon} from '@/components/ui/icon'
import {Input, InputSlot, InputField, InputIcon} from '@/components/ui/input'
import {VStack} from '@/components/ui/vstack'
import {TagList} from './tag'
import Colors from '@/constants/colors'

const TagsInput = ({mode, placeholder, value, onChangeText, onBlur, onSubmitEditing, size = 'md'}) => {
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

  const removeTag = (tagToRemove) => {
    updateTags(currentTags.filter(t => t !== tagToRemove))
  }

  const handleKeyPress = (key) => {
    if (key === 'Backspace' && latestTag === '') {
      const tagToRemove = currentTags[currentTags.length - 1]
      removeTag(tagToRemove)
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
      <VStack>
        <TagList
          items={currentTags}
          className="mb-2"
          onPress={removeTag}
        />
        <Input
            variant="outline"
            size={size}
            className="pl-5"
        >
          <InputSlot>
            <InputIcon
                as={MaterialIcon}
                code="tag"
                dsize={20}
                dcolor={Colors[mode].text}
            />
          </InputSlot>
          <InputField
              placeholder={placeholder}
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
      </VStack>
  )
}

export default TagsInput