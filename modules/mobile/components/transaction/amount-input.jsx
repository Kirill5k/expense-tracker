import React from 'react'
import {Text} from '@/components/ui/text'
import {Input, InputField, InputSlot} from '@/components/ui/input'
import {mergeClasses} from '@/utils/css'

export const AmountInput = ({onSubmitEditing, value, onChange, onBlur, currency, flat = false}) => {

  return (
      <Input variant="outline" className={mergeClasses(flat && 'border-0 bg-background-50 focus:bg-background-100')}>
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
}