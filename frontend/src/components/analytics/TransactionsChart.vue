<template>
  <div class="transactions-chart">
    <figure>
      <v-chart
        class="chart"
        :init-options="initOptions"
        :option="option"
        autoresize
      />
    </figure>
  </div>
</template>

<script>
import VChart, { THEME_KEY } from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, PieChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent])

const labelOption = {
  show: true,
  position: 'insideBottom',
  distance: '5',
  align: 'left',
  verticalAlign: 'middle',
  rotate: 90,
  formatter: '{c}  {name|{a}}',
  fontSize: 16,
  rich: { name: {} }
}

export default {
  name: 'TransactionsChart',
  components: {
    VChart
  },
  provide: {
    [THEME_KEY]: 'light'
  },
  props: {
    items: {
      type: Array,
      required: true
    },
    categories: {
      type: Object,
      required: true
    },
    currencyName: {
      type: String,
      required: true
    }
  },
  data: () => ({
    initOptions: {
      renderer: 'canvas'
    },
    option: {
      title: {
        text: 'Chart title',
        subtext: 'Small subtitle'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['current', 'previous']
      },
      xAxis: [
        {
          type: 'category',
          axisTick: { show: false },
          data: ['2012', '2013', '2014', '2015', '2016']
        }
      ],
      yAxis: [{ type: 'value' }],
      series: [
        {
          name: 'current',
          type: 'bar',
          barGap: 0,
          label: labelOption,
          emphasis: { focus: 'series' },
          data: [320, 332, 301, 334, 390]
        },
        {
          name: 'previous',
          type: 'bar',
          label: labelOption,
          emphasis: { focus: 'series' },
          data: [220, 182, 191, 234, 290]
        }
      ]
    }
  }),
  methods: {

  }
}
</script>

<style lang="scss">
.chart {
  height: 300px;
}
.transactions-chart {

}
</style>
