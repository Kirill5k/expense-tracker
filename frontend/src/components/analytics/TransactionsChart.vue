<template>
  <div class="transactions-chart">
    <figure>
      <v-chart
        :init-options="initOptions"
        :option="option"
        autoresize
        v-bind:style="{ height: `${canvasHeight}px` }"
      />
    </figure>
  </div>
</template>

<script>
import VChart, { THEME_KEY } from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, ToolboxComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, ToolboxComponent])

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
    dark: {
      type: Boolean,
      default: false
    },
    incomeTransactions: {
      type: Array,
      required: true
    },
    expenseTransactions: {
      type: Array,
      required: true
    },
    currency: {
      type: Object,
      required: true
    },
    displayDate: {
      type: Object,
      required: true
    },
    windowHeight: {
      type: Number,
      required: true
    }
  },
  data: () => ({
    initOptions: {
      renderer: 'canvas'
    }
  }),
  computed: {
    canvasHeight () {
      if (this.windowHeight < 600) {
        return 120
      } else if (this.windowHeight < 700) {
        return 200
      } else {
        return 240
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
    yAxisCurrentData () {
      return this.groupItemsByDate(this.incomeTransactions)
    },
    yAxisPreviousData () {
      return this.groupItemsByDate(this.expenseTransactions)
    },
    option () {
      return {
        grid: {
          left: '5%',
          bottom: '24%',
          top: '12%'
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
          bottom: '0%'
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
            margin: 0,
            formatter: (value) => `${this.currency.symbol}${this.formatYAxisLabel(value)}`,
            showMaxLabel: true
          },
          splitLine: { show: true }
        }],
        series: [
          {
            name: this.displayDate.text,
            type: 'bar',
            showBackground: true,
            barGap: -0.1,
            barCategoryGap: '25%',
            zlevel: 10,
            label: { show: false },
            emphasis: { focus: 'series' },
            data: this.yAxisCurrentData,
            itemStyle: {
              color: '#6200EE',
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              shadowBlur: 10,
              shadowOffsetX: 5,
              shadowOffsetY: 2
            },
            markLine: {
              data: [{ type: 'average', name: 'Average' }]
            }
          },
          {
            name: this.displayDate.previous.text,
            type: 'bar',
            zlevel: 1,
            showBackground: true,
            label: { show: false },
            emphasis: { focus: 'series' },
            data: this.yAxisPreviousData,
            itemStyle: {
              color: 'rgba(3, 218, 198, 0.6)',
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              shadowBlur: 10,
              shadowOffsetX: 5,
              shadowOffsetY: 2
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
    getItemGroup (item) {
      return this.getDateGroup(new Date(item.date))
    },
    getDateGroup (date) {
      switch (this.displayDate.range) {
        case 'yearly':
          return date.getMonth()
        case 'weekly':
          return date.getDay()
        default:
          return Math.floor((date.getDate() - 1) / 7)
      }
    },
    groupItemsByDate (items) {
      const data = new Array(this.xAxisData.length).fill(0)
      return items
        .reduce((acc, i) => {
          const group = this.getItemGroup(i)
          acc[group] = acc[group] + i.amount.value
          return acc
        }, data)
        .map(i => i.toFixed(2))
    },
    formatYAxisLabel (value) {
      if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M'
      }
      if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K'
      }
      return value
    },
    totalSpent (txs) {
      return txs.map(t => t.amount.value).reduce((acc, i) => acc + i, 0).toFixed(2)
    }
  }
}
</script>

<style lang="scss">
.transactions-chart {

}
</style>
