import {HStack} from '@/components/ui/hstack'
import {Pressable} from '@/components/ui/pressable'
import {Text} from '@/components/ui/text'
import {Box} from '@/components/ui/box'
import {mergeClasses} from '@/utils/css'

const ToggleButton = ({value, items, onChange, className, size, disabled}) => {

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
      <HStack>
        <HStack className={mergeClasses('min-h-6 items-center rounded-lg justify-between bg-background-50', className)} space="xs">
          {items.map((item, i) => (
              <Pressable
                  className="min-h-7"
                  disabled={disabled}
                  key={`${i}-${item.value}`}
                  onPress={() => handleChange(item)}
              >
                <Box className={mergeClasses('py-1 px-2 rounded-lg', isSelected(item) && 'bg-background-200')}>
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
      </HStack>
  )
}

export default ToggleButton