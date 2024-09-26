import {useState} from 'react'
import {Box} from '@/components/ui/box'
import {Text} from '@/components/ui/text'
import {VStack} from '@/components/ui/vstack'
import {CircleIcon} from '@/components/ui/icon'
import {Radio, RadioGroup, RadioIndicator, RadioLabel, RadioIcon} from '@/components/ui/radio'
import {ButtonIcon, ButtonText, Button} from '../ui/button';
import {Menu, MenuItem, MenuItemLabel} from '../ui/menu';
import {MaterialIcon} from '../ui/icon';
import colors from '@/constants/colors'

const daysAheadOptions = [7, 14, 30]

const DaysSelect = ({isDisabled, value = 7, onSelect, mode}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(new Set([value]))

  return (
      <Menu
          className="w-20 p-0"
          closeOnSelect={true}
          placement="bottom start"
          offset={0}
          selectionMode="single"
          selectedKeys={selected}
          onSelectionChange={(keys) => {
            setSelected(keys)
            onSelect(keys.currentKey)
          }}
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
          trigger={(triggerProps) => (
              <Button
                  isDisabled={isDisabled}
                  size="xs"
                  variant="link"
                  action="secondary"
                  {...triggerProps}
              >
                <ButtonText className="underline text-sm text-primary-400 font-medium">
                  {`${value} days`}
                </ButtonText>
                <ButtonIcon
                    as={MaterialIcon}
                    code={isOpen ? 'chevron-up' : 'chevron-down'}
                    dcolor={value ? colors[mode].tabIconSelected : colors[mode].text}
                />
              </Button>
          )}
      >
        {daysAheadOptions.map(d => (
            <MenuItem
                key={d}
                textValue={`${d} days`}
                className={`w-18 ${Number(value) === d ? 'bg-background-100' : ''}`}
            >
              <MenuItemLabel size="xs" className="w-20">{`${d} days`}</MenuItemLabel>
            </MenuItem>
        ))}
      </Menu>
  )
}

const HideFutureTransactionsToggle = ({isDisabled, value, onSelect, mode}) => {
  const [toggle, setToggle] = useState(value > 0 ? 1 : value)
  const [daysAhead, setDaysAhead] = useState(daysAheadOptions.includes(value) ? value : 7)

  return (
      <RadioGroup
          className="ml-1"
          value={toggle}
          onChange={(v) => {
            setToggle(v)
            onSelect(v === 1 ? daysAhead : v)
          }}
      >
        <VStack space="sm">
          <Box>
            <Radio isDisabled={isDisabled} value={0} size="sm">
              <RadioIndicator>
                <RadioIcon as={CircleIcon}/>
              </RadioIndicator>
              <RadioLabel className="pl-0.5">Hide all future transactions</RadioLabel>
            </Radio>
            <Text size="xs" className="ml-6 text-typography-500">
              Only show transactions with today’s or past dates
            </Text>
          </Box>
          <Box>
            <Radio isDisabled={isDisabled} value={1} size="sm">
              <RadioIndicator>
                <RadioIcon as={CircleIcon}/>
              </RadioIndicator>
              <RadioLabel className="pl-0.5">Show transactions for the next</RadioLabel>
              <DaysSelect
                  isDisabled={isDisabled || !value}
                  value={daysAhead}
                  onSelect={(d) => {
                    setDaysAhead(d)
                    onSelect(d)
                  }}
                  mode={mode}
              />
            </Radio>
            <Text size="xs" className="ml-6 text-typography-500" style={{marginTop: -5}}>
              View upcoming transactions within a selected range
            </Text>
          </Box>
          <Box>
            <Radio isDisabled={isDisabled} value={null} size="sm">
              <RadioIndicator>
                <RadioIcon as={CircleIcon}/>
              </RadioIndicator>
              <RadioLabel className="pl-0.5">Always show all transactions</RadioLabel>
            </Radio>
            <Text size="xs" className="ml-6 text-typography-500">
              View all transactions, including those scheduled for future dates
            </Text>
          </Box>
        </VStack>
      </RadioGroup>
  )
}

export default HideFutureTransactionsToggle