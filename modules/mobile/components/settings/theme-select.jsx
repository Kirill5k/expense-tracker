import {Box} from '@/components/ui/box'
import {Text} from '@/components/ui/text'
import {VStack} from '@/components/ui/vstack'
import {CircleIcon} from '@/components/ui/icon'
import {Radio, RadioGroup, RadioIndicator, RadioLabel, RadioIcon} from '@/components/ui/radio'

const ThemeSelect = ({isDisabled, value, onSelect}) => {
  return (
      <RadioGroup className="ml-1" value={value} onChange={onSelect}>
        <VStack space="sm">
          <Box>
            <Radio isDisabled={isDisabled} value={false} size="sm">
              <RadioIndicator>
                <RadioIcon as={CircleIcon}/>
              </RadioIndicator>
              <RadioLabel className="pl-0.5">Light</RadioLabel>
            </Radio>
            <Text size="xs" className="ml-6 text-typography-500">
              Always use light mode
            </Text>
          </Box>
          <Box>
            <Radio isDisabled={isDisabled} value={true} size="sm">
              <RadioIndicator>
                <RadioIcon as={CircleIcon}/>
              </RadioIndicator>
              <RadioLabel className="pl-0.5">Dark</RadioLabel>
            </Radio>
            <Text size="xs" className="ml-6 text-typography-500">
              Always use dark mode
            </Text>
          </Box>
          <Box>
            <Radio isDisabled={isDisabled} value={null} size="sm">
              <RadioIndicator>
                <RadioIcon as={CircleIcon}/>
              </RadioIndicator>
              <RadioLabel className="pl-0.5">System Default</RadioLabel>
            </Radio>
            <Text size="xs" className="ml-6 text-typography-500">
              Match your device’s system settings
            </Text>
          </Box>
        </VStack>
      </RadioGroup>
  )
}

export default ThemeSelect