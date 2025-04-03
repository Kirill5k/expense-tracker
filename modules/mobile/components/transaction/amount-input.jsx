import {useState, forwardRef, useRef, useEffect} from 'react'
import {HStack} from '@/components/ui/hstack'
import {VStack} from '@/components/ui/vstack'
import {Text} from '@/components/ui/text'
import {Input, InputField, InputSlot} from '@/components/ui/input'
import {Button, ButtonIcon} from '@/components/ui/button'
import {MaterialIcon} from '@/components/ui/icon'
import {mergeClasses} from '@/utils/css'
import colors from 'tailwindcss/colors'

export const AmountInput = forwardRef((
    {onSubmitEditing, value, onChange, onBlur, currency, flat = false},
    ref
) => {

  return (
      <Input
          ref={ref}
          variant="outline"
          className={mergeClasses(
              'grow',
              flat && 'border-0 bg-background-50 focus:bg-background-100'
          )}
      >
        <InputSlot>
          <Text className="pr-0 pl-5 text-xl text-primary-500">{currency.symbol}</Text>
        </InputSlot>
        <InputField
            autoComplete="off"
            inputMode="decimal"
            keyboardType="decimal-pad"
            placeholder="0.00"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            onSubmitEditing={onSubmitEditing}
            returnKeyType="done"
            importantForAutofill="no"
        />
      </Input>
  )
})

const addAtNextPos = (arr, i, el) => arr.slice(0, i + 1).concat(el).concat(arr.slice(i + 1))
const removeAt = (arr, i) => arr.filter((_, i1) => i1 !== i)

export const MultipleAmountInput = ({onSubmitEditing, value, onChange, onBlur, currency, flat = false}) => {
  const [latestInputId, setLatestInputId] = useState(0)
  const [inputs, setInputs] = useState([0])

  const handleAddButtonPress = (index) => {
    const id = latestInputId + 1
    setInputs(array => addAtNextPos(array, index, id))
    setLatestInputId(id)
  }

  const handleRemoveButtonPress = (index) => {
    setInputs(array => removeAt(array, index))
  }

  return (
      <VStack className="w-full" space="sm">
        {inputs.map((key, index) => (
            <HStack key={key} className="w-full items-center" space="sm">
              <AmountInput
                  flat={flat}
                  currency={currency}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  onSubmitEditing={onSubmitEditing}
              />
              {key !== 0 && (
                  <Button
                      size="sm"
                      className="rounded-full p-1"
                      action="secondary"
                      onPress={() => handleRemoveButtonPress(index)}
                  >
                    <ButtonIcon
                        as={MaterialIcon}
                        code="minus"
                        dsize={24}
                        dcolor={colors.red[500]}
                    />
                  </Button>
              )}
              <Button
                  size="sm"
                  className="rounded-full p-1"
                  action="secondary"
                  onPress={() => handleAddButtonPress(index)}
              >
                <ButtonIcon
                    as={MaterialIcon}
                    code="plus"
                    dsize={24}
                    dcolor={colors.green[500]}
                />
              </Button>
            </HStack>
        ))}
      </VStack>
  )
}