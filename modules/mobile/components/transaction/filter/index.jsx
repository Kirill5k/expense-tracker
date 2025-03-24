import {useState} from 'react'
import {VStack} from '@/components/ui/vstack'
import {MaterialIcon, CheckIcon} from '@/components/ui/icon'
import {Button, ButtonIcon, ButtonText} from '@/components/ui/button'
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
import {AmountSlider} from './slider'
import {Header} from './header'

const MIN_AMOUNT = 1
const MAX_AMOUNT = 1000000

const TransactionFilter = ({mode, className, categories, value, onChange}) => {
  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false)

  const handleCategoryPress = (id) => {
    const updatedCats = value.categories.includes(id)
        ? value.categories.filter(i => i !== id)
        : [...value.categories, id]
    onChange({...value, categories: updatedCats})
  }

  const hasSelectedFilters = value?.categories?.length
      || value.minAmount > MIN_AMOUNT
      || value.maxAmount < MAX_AMOUNT

  return (
      <>
        <Button
            variant="link"
            size="md"
            className={mergeClasses(
                'px-2 bg-background-100 rounded-full',
                hasSelectedFilters ? 'border-2' : 'border border-transparent',
                hasSelectedFilters && Classes[mode].selectedBorder,
                className,
            )}
            onPress={() => setShow(true)}
        >
          <ButtonIcon as={MaterialIcon} code="filter-outline" dsize={24} dcolor={Colors[mode].text}/>
        </Button>
        <Actionsheet isOpen={show} onClose={handleClose} className="w-full">
          <ActionsheetBackdrop/>
          <ActionsheetContent className="w-full bg-transparent">
            <BlurredBackground style={{borderTopRightRadius: 12, borderTopLeftRadius: 12}}/>
            <ActionsheetDragIndicatorWrapper>
              <ActionsheetDragIndicator/>
            </ActionsheetDragIndicatorWrapper>
            <VStack className="w-full px-2" space="lg">
              <AmountSlider
                  heading="Min Amount"
                  defaultValue={MIN_AMOUNT}
                  minAmount={MIN_AMOUNT}
                  maxAmount={MAX_AMOUNT}
                  value={value.minAmount}
                  onChange={(v) => onChange({...value, minAmount: v})}
              />
              <AmountSlider
                  heading="Max Amount"
                  defaultValue={MAX_AMOUNT}
                  minAmount={MIN_AMOUNT}
                  maxAmount={MAX_AMOUNT}
                  value={value.maxAmount}
                  onChange={(v) => onChange({...value, maxAmount: v})}
              />
              <Header heading="Categories">
                <Button
                    size="sm"
                    variant="link"
                    action="primary"
                    onPress={() => onChange({...value, categories: []})}
                >
                  <ButtonText>Clear All</ButtonText>
                </Button>
              </Header>
            </VStack>
            <ScrollView className="w-full h-52">
              <CheckboxGroup
                  value={value.categories}
                  onChange={(c) => onChange({...value, categories: c})}
                  className="w-full flex justify-end"
              >
                {categories.map(cat => (
                    <ActionsheetItem
                        key={cat.id}
                        onPress={() => handleCategoryPress(cat.id)}
                    >
                      <Checkbox
                          value={cat.id}
                          size="lg"
                          isInvalid={false}
                          isDisabled={false}
                      >
                        <CheckboxIndicator>
                          <CheckboxIcon as={CheckIcon}/>
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