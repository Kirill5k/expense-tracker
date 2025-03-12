import {useState} from 'react'
import {MaterialIcon, CheckIcon} from '@/components/ui/icon'
import {Button, ButtonIcon} from '@/components/ui/button'
import Colors from '@/constants/colors'
import Classes from '@/constants/classes'
import {ScrollView} from '@/components/ui/scroll-view'
import {BlurredBackground} from '@/components/common/blur'
import {
  Actionsheet,
  ActionsheetItem,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet"
import {
  CheckboxGroup,
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel
} from "@/components/ui/checkbox"
import {mergeClasses} from '@/utils/css'


const TransactionFilter = ({mode, className, categories, value, onChange}) => {
  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false)

  const handlePress = (id) => {
    if (value.includes(id)) {
      onChange(value.filter(i => i !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
      <>
        <Button
            variant="link"
            size="md"
            className={mergeClasses(
                'px-2 bg-background-100 rounded-full',
                value.length ? 'border-2' : 'border border-transparent',
                value.length && Classes[mode].selectedBorder,
                className,
            )}
            onPress={() => setShow(true)}
        >
          <ButtonIcon as={MaterialIcon} code="filter-outline" dsize={24} dcolor={Colors[mode].text}/>
        </Button>
        <Actionsheet isOpen={show} onClose={handleClose} className="w-full">
          <ActionsheetBackdrop />
          <ActionsheetContent className="w-full bg-transparent">
            <BlurredBackground style={{borderTopRightRadius: 12, borderTopLeftRadius: 12}}/>
            <ActionsheetDragIndicatorWrapper>
              <ActionsheetDragIndicator />
            </ActionsheetDragIndicatorWrapper>
            <ScrollView className="w-full h-52">
              <CheckboxGroup
                  value={value}
                  onChange={onChange}
                  className="w-full flex justify-end"
              >
                {categories.map(cat => (
                    <ActionsheetItem
                        key={cat.id}
                        onPress={() => handlePress(cat.id)}
                    >
                      <Checkbox
                          value={cat.id}
                          size="lg"
                          isInvalid={false}
                          isDisabled={false}
                      >
                        <CheckboxIndicator>
                          <CheckboxIcon as={CheckIcon} />
                        </CheckboxIndicator>
                        <CheckboxLabel>{cat.name}</CheckboxLabel>
                      </Checkbox>
                    </ActionsheetItem>
                ))}
              </CheckboxGroup>
            </ScrollView>
          </ActionsheetContent>
        </Actionsheet>
      </>
  )
}

export default TransactionFilter