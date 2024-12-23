import {useState} from 'react'
import {MaterialIcon, CheckIcon} from '@/components/ui/icon'
import {Button, ButtonIcon} from '@/components/ui/button'
import Colors from '@/constants/colors'
import {ScrollView} from '@/components/ui/scroll-view'
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetIcon,
} from "@/components/ui/actionsheet"
import {
  CheckboxGroup,
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel
} from "@/components/ui/checkbox"

const TransactionFilter = ({mode, className, categories}) => {
  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false)

  return (
      <>
        <Button
            variant="link"
            size="md"
            className={'px-2 bg-background-100 rounded-full ' + className}
            onPress={() => setShow(true)}
        >
          <ButtonIcon as={MaterialIcon} code="filter-outline" dsize={24} dcolor={Colors[mode].text}/>
        </Button>
        <Actionsheet isOpen={show} onClose={handleClose} className="w-full">
          <ActionsheetBackdrop />
          <ActionsheetContent className="w-full">
            <ActionsheetDragIndicatorWrapper>
              <ActionsheetDragIndicator />
            </ActionsheetDragIndicatorWrapper>
            <ScrollView className="w-full h-52">
              <CheckboxGroup className="w-full flex justify-end">
                {categories.map(cat => (
                    <Checkbox
                        key={cat.id}
                        value={cat.id}
                        size="lg"
                        isInvalid={false}
                        isDisabled={false}
                        className="p-2"
                    >
                      <CheckboxIndicator>
                        <CheckboxIcon as={CheckIcon} />
                      </CheckboxIndicator>
                      <CheckboxLabel>{cat.name}</CheckboxLabel>
                    </Checkbox>
                ))}
              </CheckboxGroup>
            </ScrollView>
          </ActionsheetContent>
        </Actionsheet>
      </>
  )
}

export default TransactionFilter