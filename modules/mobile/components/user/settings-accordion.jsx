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

export const SettingsAccordion = ({className, children}) => {
  return (
      <Accordion
          size="sm"
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
        <AccordionItem value={value}>
          <SettingsAccordionHeader
              title={headerTitle}
              value={headerValue}
          />
          {children}
        </AccordionItem>
        {!isLast && <Divider className="mx-5"/>}
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
                  {value != null && <Text size="sm" className="text-secondary-400">{value}</Text>}
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