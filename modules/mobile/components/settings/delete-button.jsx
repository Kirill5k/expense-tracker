import {useEffect, useState} from 'react'
import {Input, InputField} from '@/components/ui/input'
import {Button, ButtonText} from '@/components/ui/button'
import {MaterialIcon} from '@/components/ui/icon'
import {Alert, AlertIcon, AlertText} from '@/components/ui/alert'
import Colors from '@/constants/colors'

const DeleteButton = ({mode, isDisabled, alertText, buttonText, confirmationText, onPress, outline = false}) => {
  const [input, setInput] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)

  useEffect(() => {
    setIsConfirmed(input === confirmationText)
  }, [input]);

  return (
      <>
        <Alert action="error" variant="solid">
          <AlertIcon as={MaterialIcon} code="alert-circle-outline" dcolor={Colors[mode].error} dsize={16}/>
          <AlertText size="md">
            {alertText}
          </AlertText>
        </Alert>
        <Input
            variant="outline"
            size="md"
            className="mt-4"
        >
          <InputField
              autoCorrect={false}
              value={input}
              onChangeText={setInput}
              placeholder={`Type ${confirmationText} to confirm`}
              autoCapitalize="characters"
              importantForAutofill="no"
              inputMode="text"
              autoComplete="off"
              textContentType="none"
          />
        </Input>
        <Button
            isDisabled={isDisabled || !isConfirmed}
            className="my-4 w-full"
            size="sm"
            action="negative"
            variant={outline ? 'outline' : 'solid'}
            onPress={onPress}
        >
          <ButtonText className={outline ? 'text-error-500' : ''}>
            {buttonText}
          </ButtonText>
        </Button>
      </>
  )
}

export default DeleteButton