import {GoogleIcon} from '@/assets/icons/google'
import {Button, ButtonText, ButtonIcon} from '@/components/ui/button'
import {mergeClasses} from '@/utils/css'


export const GoogleSignInButton = ({className}) => {
  return (
      <Button
          size="sm"
          variant="outline"
          action="secondary"
          className={mergeClasses('w-full gap-1', className)}
          onPress={() => {}}>
        <ButtonText className="font-medium">
          Continue with Google
        </ButtonText>
        <ButtonIcon as={GoogleIcon}/>
      </Button>
  )
}