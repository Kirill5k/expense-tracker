import {HStack} from '@/components/ui/hstack'
import {Pressable} from '@/components/ui/pressable'
import {Text} from '@/components/ui/text'
import {Box} from '@/components/ui/box'

const ToggleButton = ({value, items, onChange, className, size, disabled}) => {
  const isSelected = (i, v) => i.value === v.value
  return (
      <HStack className={`min-h-7 items-center rounded-lg bg-background-50 ${className}`} space="xs">
        {items.map((item, i) => (
            <Pressable
                className="min-h-7"
                disabled={disabled}
                key={`${i}-${item.value}`}
                onPress={() => onChange(item)}
            >
              <Box className={`py-1 px-2 ${isSelected(item, value) ? 'rounded-lg bg-background-200' : 'rounded-none'}`}>
                <Text size={size} className={`font-medium ${isSelected(item, value) ? 'text-primary-900' : 'text-secondary-300'}`}>
                  {item.label}
                </Text>
              </Box>
            </Pressable>
        ))}
      </HStack>
  )
}

export default ToggleButton