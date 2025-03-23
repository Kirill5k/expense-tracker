import {useState, useCallback} from 'react'
import {Box} from '@/components/ui/box'
import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {Text} from '@/components/ui/text'
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
import debounce from 'lodash.debounce'

const SliderStep = 1
const SliderMax = 500
const MinAmount = 1
const MaxAmount = 1000000

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
      || value.minAmount > MinAmount
      || value.maxAmount < MaxAmount

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
                defaultValue={MinAmount}
                value={value.minAmount}
                onChange={(v) => onChange({...value, minAmount: v})}
              />
              <AmountSlider
                  heading="Max Amount"
                  defaultValue={MaxAmount}
                  value={value.maxAmount}
                  onChange={(v) => onChange({...value, maxAmount: v})}
              />
              <Heading>Categories</Heading>
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

const AmountSlider = ({value, onChange, heading, defaultValue}) => {
  const amountToSliderValue = (amount) => {
    const logMin = Math.log10(MinAmount)
    const logMax = Math.log10(MaxAmount)
    const logAmount = Math.log10(amount)

    // Map logarithmic amount to slider value
    return ((logAmount - logMin) / (logMax - logMin)) * SliderMax;
  }

  const sliderValueToAmount = (sliderValue) => {
    const logMin = Math.log10(MinAmount)
    const logMax = Math.log10(MaxAmount)

    // Map slider value to logarithmic amount
    const logAmount = logMin + (sliderValue / SliderMax) * (logMax - logMin);

    // Convert logarithmic amount back to linear scale
    return Math.round(Math.pow(10, logAmount))
  }

  const [currentValue, setCurrentValue] = useState(amountToSliderValue(value || defaultValue))

  const debouncedOnChange = useCallback(
      debounce((v) => onChange(sliderValueToAmount(v)), 500),
      [onChange, sliderValueToAmount]
  )

  const handleChange = useCallback(
      (v) => {
        setCurrentValue(v);
        debouncedOnChange(v);
      },
      [debouncedOnChange]
  )
  return (
      <>
        <HStack className="justify-between">
          <Heading>{heading}</Heading>
          <Text size="md">{sliderValueToAmount(currentValue)}</Text>
        </HStack>
        <Box className="w-full px-1.5">
          <Slider
              defaultValue={amountToSliderValue(defaultValue)}
              step={SliderStep}
              minValue={1}
              maxValue={SliderMax}
              sliderTrackHeight={16}
              value={currentValue}
              onChange={handleChange}
          >
            <SliderTrack>
              <SliderFilledTrack/>
            </SliderTrack>
            <SliderThumb/>
          </Slider>
        </Box>
      </>
  )
}

export default TransactionFilter