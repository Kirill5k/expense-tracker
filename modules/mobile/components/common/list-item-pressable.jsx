import React, {useState} from 'react'
import {Pressable} from '@/components/ui/pressable'

const ListItemPressable = ({onPress, children, disabled}) => {
  const [isPressed, setIsPressed] = useState(false)
  return (
      <Pressable
          disabled={disabled}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          className={`rounded-xl hover:bg-background-100 ${isPressed  ? 'bg-background-200' : ''}`}
          onPress={onPress}
      >
        {children}
      </Pressable>
  )
}

export default ListItemPressable