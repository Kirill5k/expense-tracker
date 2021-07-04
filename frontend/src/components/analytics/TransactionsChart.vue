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
import { BarChart, PieChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent, ToolboxComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, PieChart, LineChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, ToolboxComponent])

const WEEKLY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHLY_LABELS = ['1-7', '8-14', '15-21', '22-28', '29-31']
const YEARLY_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

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
    },
    displayDate: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    initOptions: {
      renderer: 'canvas'
    }
  }),
  computed: {
    xAxisData () {
      if (this.displayDate.range === 'weekly') {
        return WEEKLY_LABELS
      } else if (this.displayDate.range === 'monthly') {
        return MONTHLY_LABELS
      } else {
        return YEARLY_LABELS
      }
    },
    option () {
      return {
        title: {
          text: 'Chart title',
          subtext: 'Small subtitle'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        toolbox: {
          show: true,
          feature: {
            magicType: { show: true, type: ['line', 'bar'] }
          }
        },
        xAxis: [{
          type: 'category',
          axisTick: { show: true, alignWithLabel: true },
          data: this.xAxisData
        }],
        yAxis: [{
          type: 'value',
          boundaryGap: ['0%', '0%'],
          splitNumber: 2,
          position: 'right',
          axisLine: { show: false },
          axisLabel: { show: true, margin: 3, formatter: '£{value}', showMaxLabel: true },
          splitLine: { show: true }
        }],
        series: [
          {
            name: 'Current period',
            type: 'bar',
            showBackground: true,
            barGap: 0,
            label: { show: false },
            emphasis: { focus: 'series' },
            data: [320, 332, 301, 334, 390],
            itemStyle: {
              color: '#6200EE',
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              shadowBlur: 10,
              shadowOffsetX: 5,
              shadowOffsetY: 5
            }
          },
          {
            name: 'Previous period',
            type: 'bar',
            showBackground: true,
            label: { show: false },
            emphasis: { focus: 'series' },
            data: [220, 182, 191, 234, 290],
            itemStyle: {
              color: '#03DAC6',
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              shadowBlur: 10,
              shadowOffsetX: 5,
              shadowOffsetY: 5
            }
          }
        ]
      }
    }
  },
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
