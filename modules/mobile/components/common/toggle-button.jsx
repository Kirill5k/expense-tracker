import {HStack} from '@/components/ui/hstack'
import {Pressable} from '@/components/ui/pressable'
import {Text} from '@/components/ui/text'
import {Box} from '@/components/ui/box'

const ToggleButton = ({value, items, onChange, className, size}) => {
  return (
      <HStack className={`items-center ${className}`} space={size}>
        {items.map((i) => (
            <Pressable key={i.value} onPress={() => onChange(i)}>
              <Box className={`py-1 px-2 ${i === value ? 'rounded-xl bg-background-100' : 'rounded-none'}`}>
                <Text size={size} className={`font-medium ${i === value ? 'text-primary-900' : 'text-secondary-300'}`}>
                  {i.label}
                </Text>
              </Box>
            </Pressable>
        ))}
      </HStack>
  )
}

export default ToggleButton