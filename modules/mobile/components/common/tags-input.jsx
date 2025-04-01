import React, {useState} from 'react'
import {MaterialIcon} from '@/components/ui/icon'
import {Input, InputSlot, InputField, InputIcon} from '@/components/ui/input'
import {VStack} from '@/components/ui/vstack'
import {TagList} from './tag'
import Colors from '@/constants/colors'
import {BlurredBackground} from '@/components/common/blur'


const TagsInput = ({mode, placeholder, value, onChangeText, onBlur, onSubmitEditing, size = 'md', blurred = false}) => {
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

  const removeTag = (tagToRemove, index) => {
    updateTags([...currentTags.slice(0, index), ...currentTags.slice(index + 1)])
  }

  const handleKeyPress = (key) => {
    if (key === 'Backspace' && latestTag === '') {
      const tagToRemove = currentTags[currentTags.length - 1]
      removeTag(tagToRemove, currentTags.length - 1)
      setLatestTag(tagToRemove)
    }
  }

  const handleSubmit = (e) => {
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
          {blurred && <BlurredBackground borderRadius={6} rounded/>}
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
              onSubmitEditing={handleSubmit}
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