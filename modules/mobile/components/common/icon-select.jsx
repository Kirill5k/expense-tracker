import React from 'react'
import {ScrollView} from '@/components/ui/scroll-view'
import {Pressable} from '@/components/ui/pressable'
import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {Text} from '@/components/ui/text'
import {Divider} from '@/components/ui/divider'
import {MaterialIcon} from '@/components/ui/icon'
import {Avatar} from '@/components/ui/avatar'
import Colors from '@/constants/colors'

const iconGroups = {
  'Banking': [
    'mdi-bank-transfer',
    'mdi-bank-transfer-in',
    'mdi-bank-transfer-out',
    'mdi-account-cash',
    'mdi-credit-card',
    'mdi-bank',
    'mdi-cash',
    'mdi-chart-areaspline',
    'mdi-finance',
    'mdi-piggy-bank',
    'mdi-safe',
    'mdi-wallet',
    'mdi-send',
    'mdi-currency-eur',
    'mdi-currency-gbp',
    'mdi-currency-usd',
    'mdi-bitcoin',
  ],
  'Entertainment': [
    'mdi-camera',
    'mdi-cellphone',
    'mdi-guitar-acoustic',
    'mdi-headphones',
    'mdi-microphone',
    'mdi-monitor',
    'mdi-music',
    'mdi-piano',
    'mdi-tablet',
    'mdi-television',
    'mdi-controller',
    'mdi-watch',
    'mdi-drama-masks'
  ],
  'Food, drink': [
    'mdi-beer',
    'mdi-bottle-soda',
    'mdi-bowl-mix',
    'mdi-coffee',
    'mdi-cookie',
    'mdi-cup',
    'mdi-cupcake',
    'mdi-fish',
    'mdi-food-fork-drink',
    'mdi-glass-cocktail',
    'mdi-grill',
    'mdi-silverware',
    'mdi-hamburger',
    'mdi-pizza',
  ],
  'Holiday': [
    'mdi-bed-double',
    'mdi-cake',
    'mdi-coffin',
    'mdi-firework',
    'mdi-food-turkey',
    'mdi-gift',
    'mdi-halloween',
    'mdi-party-popper',
    'mdi-pine-tree',
    'mdi-snowflake',
  ],
  'Household': [
    'mdi-antenna',
    'mdi-water',
    'mdi-flash',
    'mdi-fire',
    'mdi-home',
    'mdi-lightbulb',
    'mdi-umbrella',
    'mdi-water-pump',
    'mdi-web',
    'mdi-wifi',
    'mdi-baby-carriage',
    'mdi-shield-car',
    'mdi-garage',
    'mdi-cog',
    'mdi-wrench',
    'mdi-hammer',
    'mdi-gauge'
  ],
  'Shopping': [
    'mdi-basket',
    'mdi-hanger',
    'mdi-cart',
    'mdi-cash-register',
    'mdi-shopping',
    'mdi-store',
    'mdi-wallet-giftcard',
    'mdi-pill',
    'mdi-tag',
  ],
  'Sport': [
    'mdi-basketball',
    'mdi-bike',
    'mdi-bowling',
    'mdi-dumbbell',
    'mdi-run',
    'mdi-soccer',
    'mdi-tennis',
    'mdi-trophy',
    'mdi-yoga',
  ],
  'Transport, travel': [
    'mdi-ticket',
    'mdi-airplane',
    'mdi-ambulance',
    'mdi-bag-carry-on',
    'mdi-bag-suitcase',
    'mdi-bus',
    'mdi-car',
    'mdi-rocket',
    'mdi-train',
    'mdi-tram',
    'mdi-walk',
    'mdi-van-passenger',
    'mdi-van-utility',
    'mdi-gas-station',
    'mdi-taxi',
    'mdi-palm-tree',
  ]
}

const IconSelect = ({value, onChange, valueColor, mode}) => {
  return (
      <ScrollView className="max-h-60 border border-secondary-200 rounded-md pb-8" persistentScrollbar={true}>
        <VStack>
          {Object.entries(iconGroups).map(([g, icons]) => (
              <VStack key={g}>
                <Text className="p-3 text-md font-medium text-primary-900">{g}</Text>
                <Divider className="mx-3"/>
                <HStack className="p-3 pl-4 w-full flex flex-wrap" space="lg">
                  {icons.map((i) => (
                      <Pressable
                          key={i}
                          onPress={() => onChange(i)}
                      >
                        <Avatar size="sm" style={{backgroundColor: value === i ? valueColor : Colors[mode].text}}>
                          <MaterialIcon
                              code={i}
                              dsize={20}
                              dcolor={Colors[mode].background}
                          />
                        </Avatar>
                      </Pressable>
                  ))}
                </HStack>
              </VStack>
          ))}
        </VStack>
      </ScrollView>
  )
}

export default IconSelect