import {useState} from 'react'
import {VStack} from '@/components/ui/vstack'
import {
  Button,
  ButtonText,
  ButtonIcon,
} from '@/components/ui/button'
import {Fab, FabIcon} from '@/components/ui/fab'
import {MaterialIcon} from '@/components/ui/icon'
import colors from '@/constants/colors'
import {mergeClasses} from '@/utils/css'

export const FloatingButtonStack = ({mode, className, buttons}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
      <VStack
        className={mergeClasses('items-end', className)}
        space="md"
      >
        <Button
            size="lg"
            className="rounded-full px-2 h-12 w-12"
            onPress={() => setIsOpen(!isOpen)}
        >
          <ButtonIcon
              as={MaterialIcon}
              code={isOpen ? 'close' : 'plus'}
              dsize={28}
              dcolor={colors[mode].background}
          />
        </Button>
        {buttons.map((button) => isOpen && (
            <Button
                size="lg"
                className="rounded-full px-2 h-12 w-12 bg-background-700"
                key={button.icon}
                onPress={() => {
                  setIsOpen(false)
                  button.onPress()
                }}
            >
              <ButtonIcon
                  as={MaterialIcon}
                  code={button.icon}
                  dsize={26}
                  dcolor={colors[mode].background}
              />
            </Button>
        ))}
      </VStack>
  )
}

const FloatingButton = ({onPress, mode, iconCode}) => {
  return (
      <Fab
          onPress={onPress}
          placement="bottom right"
          className=""
      >
        <FabIcon
            as={MaterialIcon}
            code={iconCode}
            dsize={26}
            dcolor={colors[mode].background}
        />
      </Fab>
  )
}

export default FloatingButton