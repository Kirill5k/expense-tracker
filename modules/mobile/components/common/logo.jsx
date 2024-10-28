import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {Box} from '@/components/ui/box'
import {PieChart} from 'react-native-gifted-charts'
import Colors from '@/constants/colors'

export const LogoChart = ({mode}) => {

  const data = [
    {color: '#2563eb', value: 20},
    {color: '#3b82f6', value: 15},
    {color: '#60a5fa', value: 23},
    {color: '#93c5fd', value: 12},
    {color: '#bfdbfe', value: 30},
  ]

  return (
      <Box className="w-full flex items-center justify-center my-1">
        <PieChart
            sectionAutoFocus
            data={data}
            donut
            radius={90}
            innerRadius={65}
            innerCircleColor={Colors[mode].splashScreenBackground}
            strokeColor={Colors[mode].splashScreenBackground}
            strokeWidth={6}
            centerLabelComponent={() => (
                <VStack className="items-center justify-center">
                  <Heading size="5xl" className="pt-5 text-blue-500 text-8xl">
                    $
                  </Heading>
                </VStack>
            )}
        />
      </Box>
  )
}
