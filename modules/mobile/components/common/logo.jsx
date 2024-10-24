import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {Box} from '@/components/ui/box'
import {PieChart} from 'react-native-gifted-charts'
import Colors from '@/constants/colors'

export const LogoChart = ({mode}) => {

  const data = [
    {color: '#a78bfa', value: 20},
    {color: '#57c2f6', value: 15},
    {color: '#34d399', value: 25},
    {color: '#fb7185', value: 10},
    {color: '#22d3ee', value: 30},
  ]

  return (
      <Box className="w-full flex items-center justify-center my-1">
        <PieChart
            sectionAutoFocus
            data={data}
            donut
            radius={90}
            innerRadius={60}
            innerCircleColor={Colors[mode].background}
            strokeColor={Colors[mode].background}
            strokeWidth={6}
            centerLabelComponent={() => (
                <VStack className="items-center justify-center">
                  <Heading size="4xl" className="text-primary-400">
                    $
                  </Heading>
                </VStack>
            )}
        />
      </Box>
  )
}
