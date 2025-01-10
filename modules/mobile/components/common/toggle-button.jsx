import {HStack} from '@/components/ui/hstack'
import {Pressable} from '@/components/ui/pressable'
import {Text} from '@/components/ui/text'
import {Box} from '@/components/ui/box'
import {mergeClasses} from '@/utils/css'

const ToggleButton = ({value, items, onChange, className, selectedItemClassName, size, disabled}) => {

  const isSelected = (i) => {
    if (typeof value === 'string') {
      return i.value === value
    }
    return i.value === value.value
  }

  const handleChange = (item) => {
    if (typeof value === 'string') {
      onChange(item.value)
    } else {
      onChange(item)
    }
  }

  return (
      <HStack className={mergeClasses('min-h-7 items-center rounded-lg', className)} space="xs">
        {items.map((item, i) => (
            <Pressable
                className="min-h-7"
                disabled={disabled}
                key={`${i}-${item.value}`}
                onPress={() => handleChange(item)}
            >
              <Box
                  className={mergeClasses(
                      'py-1 px-2',
                      isSelected(item) ? 'rounded-lg bg-background-100' : 'rounded-none',
                      isSelected(item) && selectedItemClassName
                  )}
              >
                <Text
                    size={size}
                    className={mergeClasses('font-medium', isSelected(item) ? 'text-primary-900' : 'text-secondary-300')}
                >
                  {item.label}
                </Text>
              </Box>
            </Pressable>
        ))}
      </HStack>
  )
}

export default ToggleButton