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
            radius={60}
            innerRadius={42}
            innerCircleColor={Colors[mode].splashScreenBackground}
            strokeColor={Colors[mode].splashScreenBackground}
            strokeWidth={6}
            centerLabelComponent={() => (
                <Box className="w-full h-full flex items-center justify-center">
                  <Heading size="5xl" className="pt-[10px] text-blue-500">
                    $
                  </Heading>
                </Box>
            )}
        />
      </Box>
  )
}
