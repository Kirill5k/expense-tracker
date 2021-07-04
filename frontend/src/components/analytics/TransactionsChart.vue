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
    currency: {
      type: String,
      required: true
    },
    displayDate: {
      type: Object,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    }
  },
  data: () => ({
    priceUp: true,
    initOptions: {
      renderer: 'canvas'
    }
  }),
  computed: {
    period () {
      if (this.displayDate.range === 'weekly') {
        return 'week'
      } else if (this.displayDate.range === 'monthly') {
        return 'month'
      } else {
        return 'year'
      }
    },
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
        grid: {
          left: '5%',
          bottom: '10%',
          top: '25%'
        },
        title: {
          itemGap: 5,
          padding: [15, 0, 5, 10],
          text: `${this.currency}${this.totalAmount}`,
          subtext: `Total spend {${this.priceUp ? 'up' : 'down'}|${this.priceUp ? 'V' : '^'}}{${this.priceUp ? 'a' : 'b'}|${this.currency}40}`,
          subtextStyle: {
            rich: {
              a: { fontSize: 12, fontWeight: 'bold', color: 'green' },
              b: { fontSize: 12, fontWeight: 'bold', color: 'red' },
              down: { color: 'red', fontWeight: '1000', fontSize: 20, padding: [0, 0, -8, 0], width: 14 },
              up: { color: 'green', fontWeight: '1000', fontSize: 14, padding: [0, 2, 0, 4] }
            }
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        toolbox: {
          show: true,
          feature: {
            magicType: { show: true, type: ['line', 'bar'] }
          },
          right: '2%',
          top: '5%'
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
          axisLabel: {
            show: true,
            margin: 3,
            formatter: `${this.currency}{value}`,
            showMaxLabel: true
          },
          splitLine: { show: true }
        }],
        series: [
          {
            name: 'Current ' + this.period,
            type: 'bar',
            showBackground: true,
            barGap: -0.1,
            barCategoryGap: '25%',
            zlevel: 1,
            label: { show: false },
            emphasis: { focus: 'series' },
            data: [320, 332, 301, 334, 390],
            itemStyle: {
              color: '#6200EE',
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              shadowBlur: 10,
              shadowOffsetX: 5,
              shadowOffsetY: 5
            },
            markLine: {
              data: [{ type: 'average', name: 'Average' }]
            }
          },
          {
            name: 'Previous ' + this.period,
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
            },
            markLine: {
              data: [{ type: 'average', name: 'Average' }]
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
  height: 250px;
}
.transactions-chart {

}
</style>
