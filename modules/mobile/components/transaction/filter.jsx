import {useState} from 'react'
import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {Slider, SliderTrack, SliderFilledTrack, SliderThumb} from '@/components/ui/slider'
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

const SliderStep = 1
const SliderMax = 500
const MinAmount = 1
const MaxAmount = 50000


function amountToSliderValue(amount) {
  const logMin = Math.log10(MinAmount)
  const logMax = Math.log10(MaxAmount)
  const logAmount = Math.log10(amount)

  // Map logarithmic amount to slider value
  return ((logAmount - logMin) / (logMax - logMin)) * SliderMax;
}

function sliderValueToAmount(sliderValue) {
  const logMin = Math.log10(MinAmount)
  const logMax = Math.log10(MaxAmount)

  // Map slider value to logarithmic amount
  const logAmount = logMin + (sliderValue / SliderMax) * (logMax - logMin);

  // Convert logarithmic amount back to linear scale
  return Math.round(Math.pow(10, logAmount))
}


const TransactionFilter = ({mode, className, categories, value, onChange}) => {
  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false)

  const handleCategoryPress = (id) => {
    if (value.categories.includes(id)) {
      onChange({
        ...value,
        categories: value.categories.filter(i => i !== id)
      })
    } else {
      onChange({
        ...value,
        categories: [...value.categories, id]
      })
    }
  }

  const hasSelectedFilters = value?.categories?.length

  const handleMinAmountChange = v => {
    onChange({...value, minAmount: sliderValueToAmount(v)})
  }

  const handleMaxAmountChange = v => {
    onChange({...value, maxAmount: sliderValueToAmount(v)})
  }

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
          <ActionsheetBackdrop />
          <ActionsheetContent className="w-full bg-transparent">
            <BlurredBackground style={{borderTopRightRadius: 12, borderTopLeftRadius: 12}}/>
            <ActionsheetDragIndicatorWrapper>
              <ActionsheetDragIndicator />
            </ActionsheetDragIndicatorWrapper>
            <VStack className="w-full px-3" space="lg">
              <Heading>Min Amount: {value.minAmount || MinAmount}</Heading>
              <Slider
                  defaultValue={MinAmount}
                  step={SliderStep}
                  minValue={1}
                  maxValue={SliderMax}
                  sliderTrackHeight={16}
                  value={amountToSliderValue(value.minAmount || MinAmount)}
                  onChange={handleMinAmountChange}
              >
                <SliderTrack>
                  <SliderFilledTrack/>
                </SliderTrack>
                <SliderThumb/>
              </Slider>
              <Heading>Max Amount: {value.maxAmount || MaxAmount}</Heading>
              <Slider
                  defaultValue={MaxAmount}
                  step={SliderStep}
                  minValue={1}
                  maxValue={SliderMax}
                  sliderTrackHeight={16}
                  value={amountToSliderValue(value.maxAmount || MaxAmount)}
                  onChange={handleMaxAmountChange}
              >
                <SliderTrack>
                  <SliderFilledTrack/>
                </SliderTrack>
                <SliderThumb/>
              </Slider>
              <Heading>Categories:</Heading>
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