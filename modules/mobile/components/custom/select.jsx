import React, {useState} from 'react';
import {ButtonIcon, ButtonText, Button} from '../ui/button';
import {MaterialIcon} from '../ui/icon';
import {Popover, PopoverBackdrop, PopoverBody, PopoverContent} from '../ui/popover';
import {ScrollView} from "../ui/scroll-view";
import {VStack} from "../ui/vstack";
import {HStack} from "../ui/hstack";
import {Text} from "../ui/text";
import {Pressable} from "../ui/pressable";
import colors from '@/constants/colors'

const Select = ({items, value, onSelect, size = 'sm', mode = 'light'}) => {
  const [open, setOpen] = useState(false)

  return (
      <Popover
          size="full"
          isOpen={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          trigger={(triggerProps) => (
              <Button
                  size={size}
                  variant="outline"
                  action="secondary"
                  className="justify-between"
                  {...triggerProps}
              >
                <ButtonText>
                  Category
                </ButtonText>
                <ButtonIcon
                    as={MaterialIcon}
                    code={open ? 'chevron-up' : 'chevron-down'}
                    dcolor={value ? colors[mode].tabIconSelected : colors[mode].text}
                />
              </Button>
          )}
      >
        <PopoverBackdrop/>
        <PopoverContent className="bg-background-50 p-0">
          <PopoverBody>
            <ScrollView className="max-h-80">
              <VStack className="py-2" space="sm">
                {items.map((item, i) => (
                    <Pressable key={i} onPress={() => {
                      console.log('test')
                      onSelect(item.value)
                      setOpen(false)
                    }}>
                      <HStack
                          className={`p-2 flex items-center hover:bg-background-100`}
                          space="md"
                      >
                        {item.icon && (
                            <MaterialIcon
                                code={item.icon}
                                dsize={24}
                                dcolor={colors[mode].text}
                            />
                        )}
                        <Text className="text-sm text-primary-500">{item.name}</Text>
                      </HStack>
                    </Pressable>
                ))}
              </VStack>
            </ScrollView>
          </PopoverBody>
        </PopoverContent>
      </Popover>
  )
}

export default Select