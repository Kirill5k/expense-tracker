import React, {useState} from 'react'
import {VStack} from '@/components/ui/vstack';
import {Box} from '@/components/ui/box';
import {Heading} from '@/components/ui/heading';
import {ScrollView} from "@/components/ui/scroll-view";
import * as Progress from 'react-native-progress'
import CategoryList from '@/components/category/list'
import Classes from '@/constants/classes'
import Colors from '@/constants/colors'
import useStore from '@/store'

export const Categories = () => {
  const [headerSize, setHeaderSize] = useState("2xl")
  const [loading, setLoading] = useState(false)

  const {
    mode,
    categories
  } = useStore()

  return (
      <VStack className={Classes.dashboardLayout}>
        <Heading size={headerSize} className="font-roboto pb-2">
          Categories
        </Heading>
        <ScrollView
            className="max-w-[600px] flex-1"
            showsVerticalScrollIndicator={false}
            stickyHeaderIndices={[0]}
            onScroll={({nativeEvent}) => {
              if (nativeEvent.contentOffset.y <= 40) {
                setHeaderSize('2xl')
              } else {
                setHeaderSize('sm')
              }
            }}
        >
          <Box>
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
          <CategoryList
              items={categories}
              disabled={loading}
          />
        </ScrollView>
      </VStack>
  )
}
