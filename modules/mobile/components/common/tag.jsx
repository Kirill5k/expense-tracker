import {Box} from '@/components/ui/box'
import {Text} from '@/components/ui/text'
import {mergeClasses} from '@/utils/css'

const Tag = ({text, className}) => {

  return (
      <Box className={mergeClasses('rounded-lg bg-background-100', className)}>
        <Text className="rounded-lg text-typography-900 text-sm font-medium p-1.5 py-0.5">
          {text}
        </Text>
      </Box>
  )
}

export default Tag