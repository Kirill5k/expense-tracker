import {HStack} from '@/components/ui/hstack'
import {Heading} from '@/components/ui/heading'

export const Header = ({heading, children}) => {

  return (
      <HStack className="justify-between items-center">
        <Heading size="md">{heading}</Heading>
        {children}
      </HStack>
  )
}