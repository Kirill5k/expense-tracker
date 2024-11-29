import {HStack} from '@/components/ui/hstack'
import {Box} from '@/components/ui/box'
import {Text} from '@/components/ui/text'
import {mergeClasses} from '@/utils/css'
import React from "react";

export const TagList = ({items, className, tagClassName}) => {

  if (!items?.length) {
    return null
  }

  return (
      <HStack space="xs" className={mergeClasses('flex flex-wrap', className)}>
        {items.map(((t, i) => (<Tag key={`${t}-${i}`} text={t} className={tagClassName}/>)))}
      </HStack>
  )
}

const Tag = ({text, className}) => {
  return (
      <Box className={mergeClasses('rounded-lg bg-background-200', className)}>
        <Text className="rounded-lg text-typography-900 text-sm font-medium p-1.5 py-0.5">
          {text}
        </Text>
      </Box>
  )
}

export default Tag