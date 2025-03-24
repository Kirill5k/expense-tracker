import {useCallback, useState} from 'react'
import {Slider, SliderTrack, SliderFilledTrack, SliderThumb} from '@/components/ui/slider'
import {Box} from '@/components/ui/box'
import {Text} from '@/components/ui/text'
import {Header} from './header'
import debounce from 'lodash.debounce'

const SliderMax = 1000

export const AmountSlider = ({value, onChange, heading, defaultValue, minAmount = 1, maxAmount = 1000000}) => {
  const amountToSliderValue = (amount) => {
    const logMin = Math.log10(minAmount)
    const logMax = Math.log10(maxAmount)
    const logAmount = Math.log10(amount)

    // Map logarithmic amount to slider value
    return ((logAmount - logMin) / (logMax - logMin)) * SliderMax;
  }

  const sliderValueToAmount = (sliderValue) => {
    const logMin = Math.log10(minAmount)
    const logMax = Math.log10(maxAmount)

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
        <Header heading={heading}>
          <Text size="md">{sliderValueToAmount(currentValue)}</Text>
        </Header>
        <Box className="w-full px-1.5">
          <Slider
              defaultValue={amountToSliderValue(defaultValue)}
              step={1}
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
