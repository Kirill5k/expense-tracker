import {useState} from 'react'
import {Box} from '@/components/ui/box'
import {Button, ButtonText} from '@/components/ui/button'
import {Heading} from '@/components/ui/heading'
import {VStack} from '@/components/ui/vstack'
import {ScrollView} from '@/components/ui/scroll-view'
import Profile from '@/components/user/profile'
import {SettingsAccordion, SettingsAccordionItem} from '@/components/user/settings-accordion'
import {AccordionContent, AccordionContentText} from '@/components/ui/accordion'
import Classes from '@/constants/classes'
import useStore from '@/store'

export const Settings = () => {
  const [headerSize, setHeaderSize] = useState("2xl")
  const {mode, user} = useStore()
  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size={headerSize} className="pb-2">
          Settings
        </Heading>
        <ScrollView>
          <Profile user={user}/>
          <Heading className="py-2" size="xl">
            General
          </Heading>
          <SettingsAccordion>
            <SettingsAccordionItem
                value="1"
                headerTitle="Currency"
                headerValue={user.settings.currency.symbol}
            >
              <AccordionContent>
                <AccordionContentText>
                  To place an order, simply select the products you want, proceed to
                  checkout, provide shipping and payment information, and finalize your
                  purchase.
                </AccordionContentText>
              </AccordionContent>
            </SettingsAccordionItem>
            <SettingsAccordionItem
                value="2"
                headerTitle="Hide Future Transactions"
                headerValue={user.settings.hideFutureTransactions ? 'Yes' : 'No'}
            >
              <AccordionContent>
                <AccordionContentText>
                  To place an order, simply select the products you want, proceed to
                  checkout, provide shipping and payment information, and finalize your
                  purchase.
                </AccordionContentText>
              </AccordionContent>
            </SettingsAccordionItem>
            <SettingsAccordionItem
                isLast
                value="3"
                headerTitle="Dark Mode"
                headerValue={user.settings.darkMode === true ? 'On' : user.settings.darkMode === false ? 'Off' : 'Auto'}
            >
              <AccordionContent>
                <AccordionContentText>
                  To place an order, simply select the products you want, proceed to
                  checkout, provide shipping and payment information, and finalize your
                  purchase.
                </AccordionContentText>
              </AccordionContent>
            </SettingsAccordionItem>
          </SettingsAccordion>

          <Heading className="py-2" size="xl">
            Security
          </Heading>
          <SettingsAccordion>
            <SettingsAccordionItem
                value="4"
                headerTitle="Change Password"
            >
              <AccordionContent>
                <AccordionContentText>
                  To place an order, simply select the products you want, proceed to
                  checkout, provide shipping and payment information, and finalize your
                  purchase.
                </AccordionContentText>
              </AccordionContent>
            </SettingsAccordionItem>
            <SettingsAccordionItem
                value="5"
                headerTitle="Erase All Transactions"
            >
              <AccordionContent>
                <AccordionContentText>
                  To place an order, simply select the products you want, proceed to
                  checkout, provide shipping and payment information, and finalize your
                  purchase.
                </AccordionContentText>
              </AccordionContent>
            </SettingsAccordionItem>
            <SettingsAccordionItem
                isLast
                value="6"
                headerTitle="Close Account"
            >
              <AccordionContent>
                <AccordionContentText>
                  To place an order, simply select the products you want, proceed to
                  checkout, provide shipping and payment information, and finalize your
                  purchase.
                </AccordionContentText>
              </AccordionContent>
            </SettingsAccordionItem>
          </SettingsAccordion>

          <Box className="px-5">
            <Button className="my-4 w-full" size="xs" variant="outline" action="secondary">
              <ButtonText>
                Sign Out
              </ButtonText>
            </Button>
          </Box>
        </ScrollView>
      </VStack>
  )
}
