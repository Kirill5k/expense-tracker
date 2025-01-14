import {HStack} from '@/components/ui/hstack'
import {Text} from '@/components/ui/text'
import {Button, ButtonIcon} from '@/components/ui/button'
import {CloseIcon} from '@/components/ui/icon'
import {mergeClasses} from '@/utils/css'

export const TagList = ({items, className, tagClassName, onPress}) => {

  if (!items?.length) {
    return null
  }

  return (
      <HStack space="xs" className={mergeClasses('flex flex-wrap', className)}>
        {items.map(((t, i) => (<Tag key={`${t}-${i}`} text={t} index={i} onPress={onPress} className={tagClassName}/>)))}
      </HStack>
  )
}

const Tag = ({text, className, onPress, index = 0}) => {

  return (
      <HStack className={mergeClasses('rounded-lg bg-background-200 items-center justify-center px-2', className)} space="xs">
        <Text className="rounded-lg text-typography-900 text-sm font-medium pb-0.5">
          {text}
        </Text>
        {onPress && (
            <Button
                size="xs"
                variant="link"
                onPress={() => onPress(text, index)}
            >
              <ButtonIcon as={CloseIcon}/>
            </Button>
        )}
      </HStack>
  )
}

export default Tag