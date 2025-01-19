import {HStack} from '@/components/ui/hstack'
import {Text} from '@/components/ui/text'
import {Divider} from '@/components/ui/divider'
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionTitleText,
  AccordionContent,
  AccordionIcon,
} from '@/components/ui/accordion'
import {ChevronDownIcon, ChevronUpIcon} from '@/components/ui/icon'

export const SettingsAccordion = ({isDisabled, className, children}) => {
  return (
      <Accordion
          isDisabled={isDisabled}
          size="md"
          variant="unfilled"
          type="single"
          isCollapsible={true}
          className={`mb-4 rounded-xl bg-background-50 ${className}`}
      >
        {children}
      </Accordion>
  )
}

export const SettingsAccordionItem = ({isLast, value, children, headerTitle, headerValue}) => {
  return (
      <>
        <AccordionItem value={value} className="py-1">
          <SettingsAccordionHeader
              title={headerTitle}
              value={headerValue}
          />
          {children}
        </AccordionItem>
        {!isLast && <Divider className=""/>}
      </>
  )
}

export const SettingsAccordionHeader = ({title, value}) => {
  return (
      <AccordionHeader>
        <AccordionTrigger>
          {({isExpanded}) => (
              <>
                <AccordionTitleText>{title}</AccordionTitleText>
                <HStack className="items-center">
                  {value != null && <Text size="md" className="text-secondary-400">{value}</Text>}
                  {isExpanded ? (
                      <AccordionIcon as={ChevronUpIcon} className="ml-3"/>
                  ) : (
                      <AccordionIcon as={ChevronDownIcon} className="ml-3"/>
                  )}
                </HStack>
              </>
          )}
        </AccordionTrigger>
      </AccordionHeader>
  )
}

export const SettingsAccordionContent = ({children}) => {
  return (
      <AccordionContent>
        {children}
      </AccordionContent>
  )
}