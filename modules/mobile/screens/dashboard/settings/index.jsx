import {useState} from 'react'
import {Box} from '@/components/ui/box'
import {Button, ButtonText} from '@/components/ui/button'
import {Heading} from '@/components/ui/heading'
import {Divider} from '@/components/ui/divider'
import {VStack} from '@/components/ui/vstack'
import {ScrollView} from '@/components/ui/scroll-view'
import Profile from '@/components/settings/profile'
import CurrencySelect from '@/components/settings/currency-select'
import ThemeSelect from '@/components/settings/theme-select'
import FutureTransactionsToggle from '@/components/settings/future-transactions-toggle'
import {SettingsAccordion, SettingsAccordionItem, SettingsAccordionContent} from '@/components/settings/accordion'
import {AccordionContent, AccordionContentText} from '@/components/ui/accordion'
import Classes from '@/constants/classes'
import useStore from '@/store'
import * as Progress from "react-native-progress";
import Colors from '@/constants/colors'


const themeDisplayLabel = (darkMode) => {
  if (darkMode === null) return 'System'
  if (darkMode === true) return 'Dark'
  return 'Light'
}

const hideFutureTransactionsDisplayLabel = (futureTransactionVisibilityDays) => {
  if (futureTransactionVisibilityDays === 0) return 'All'
  if (!futureTransactionVisibilityDays) return 'No'
  return `${futureTransactionVisibilityDays} Days`
}


export const Settings = () => {
  const [isScrolling, setIsScrolling] = useState(false)
  const [loading, setLoading] = useState(false)
  const {
    mode,
    user,
    updateUserSettings,
    logout
  } = useStore()

  const handleLogout = () => {
    setLoading(true)
    logout()
  }

  const handleUpdateSettings = (settings) => {
    setLoading(true)
    updateUserSettings(settings).then(() => setLoading(false))
  }

  if (!user) return null

  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size={isScrolling ? 'sm' : '2xl'} className="pb-2">
          Settings
        </Heading>
        <Box>
          {isScrolling && <Divider/>}
          {loading && <Progress.Bar
              height={3}
              animationType="decay"
              borderRadius={0}
              borderWidth={0}
              indeterminateAnimationDuration={250}
              width={null}
              indeterminate={true}
              color={Colors[mode].tint}
              borderColor={Colors[mode].tint}
          />}
        </Box>
        <ScrollView
            showsVerticalScrollIndicator={false}
            onScroll={({nativeEvent}) => {
              if (nativeEvent.contentOffset.y <= 20 && isScrolling) {
                setIsScrolling(false)
              } else if (nativeEvent.contentOffset.y > 20 && !isScrolling) {
                setIsScrolling(true)
              }
            }}
        >
          <Profile user={user}/>
          <Heading className="py-2" size="xl">
            General
          </Heading>
          <SettingsAccordion
              isDisabled={loading}
          >
            <SettingsAccordionItem
                value="1"
                headerTitle="Currency"
                headerValue={user?.settings?.currency?.symbol}
            >
              <SettingsAccordionContent>
                <VStack space="sm">
                  <AccordionContentText>
                    Select your default currency for logging and viewing transactions. Existing transactions will retain
                    their original currency.
                  </AccordionContentText>
                  <CurrencySelect
                      isDisabled={loading}
                      mode={mode}
                      value={user?.settings?.currency}
                      onSelect={(currency) => {
                        handleUpdateSettings({...user.settings, currency})
                      }}
                  />
                </VStack>
              </SettingsAccordionContent>
            </SettingsAccordionItem>
            <SettingsAccordionItem
                value="2"
                headerTitle="Hide Future Transactions"
                headerValue={hideFutureTransactionsDisplayLabel(user?.settings?.futureTransactionVisibilityDays)}
            >
              <AccordionContent>
                <FutureTransactionsToggle
                    isDisabled={loading}
                    mode={mode}
                    value={user?.settings?.futureTransactionVisibilityDays}
                    onSelect={(futureTransactionVisibilityDays) => {
                      handleUpdateSettings({...user.settings, futureTransactionVisibilityDays})
                    }}
                />
              </AccordionContent>
            </SettingsAccordionItem>
            <SettingsAccordionItem
                isLast
                value="3"
                headerTitle="Theme"
                headerValue={themeDisplayLabel(user?.settings?.darkMode)}
            >
              <SettingsAccordionContent>
                <ThemeSelect
                    isDisabled={loading}
                    value={user?.settings?.darkMode}
                    onSelect={(darkMode) => {
                      handleUpdateSettings({...user.settings, darkMode})
                    }}
                />
              </SettingsAccordionContent>
            </SettingsAccordionItem>
          </SettingsAccordion>

          <Heading className="py-2" size="xl">
            Security
          </Heading>
          <SettingsAccordion
              isDisabled={loading}
          >
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
              <ButtonText onPress={handleLogout}>
                Sign Out
              </ButtonText>
            </Button>
          </Box>
        </ScrollView>
      </VStack>
  )
}
