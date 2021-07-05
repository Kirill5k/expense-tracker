<template>
  <div class="transactions-chart">
    <figure>
      <v-chart
        class="transactions-chart__canvas"
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
    currentItems: {
      type: Array,
      required: true
    },
    previousItems: {
      type: Array,
      required: true
    },
    categories: {
      type: Object,
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
    totalAmount: {
      type: [String, Number],
      required: true
    },
    previousTotalAmount: {
      type: [String, Number],
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
    yAxisCurrentData () {
      return this.groupItemsByDate(this.currentItems)
    },
    yAxisPreviousData () {
      return this.groupItemsByDate(this.previousItems)
    },
    spendingDifference () {
      return Math.abs(Number(this.totalAmount) - Number(this.previousTotalAmount)).toFixed(2)
    },
    subtext () {
      if (this.totalAmount === this.previousTotalAmount) {
        return 'Total spend'
      } else if (Number(this.totalAmount) < Number(this.previousTotalAmount)) {
        return `Total spend {up|↓}{a|${this.currency.symbol}${this.spendingDifference}}`
      } else {
        return `Total spend {down|↑}{b|${this.currency.symbol}${this.spendingDifference}}`
      }
    },
    period () {
      if (this.displayDate.range === 'weekly') {
        return 'week'
      } else if (this.displayDate.range === 'monthly') {
        return 'month'
      } else {
        return 'year'
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
          text: `${this.currency.symbol}${this.totalAmount}`,
          subtext: this.subtext,
          subtextStyle: {
            rich: {
              a: { fontSize: 12, fontWeight: 'bold', color: 'green' },
              b: { fontSize: 12, fontWeight: 'bold', color: 'red' },
              down: { color: 'red', fontWeight: '1000', fontSize: 20, padding: [-3, 1, -3, 1] },
              up: { color: 'green', fontWeight: '1000', fontSize: 20, padding: [-3, 1, -3, 1] }
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
            formatter: `${this.currency.symbol}{value}`,
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
            name: 'Previous ' + this.period,
            type: 'bar',
            showBackground: true,
            label: { show: false },
            emphasis: { focus: 'series' },
            data: this.yAxisPreviousData,
            itemStyle: {
              color: '#03DAC6',
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
      switch (this.displayDate.range) {
        case 'yearly':
          return new Date(item.date).getMonth()
        case 'weekly':
          return new Date(item.date).getDay()
        default:
          return Math.floor((new Date(item.date).getDate() - 1) / 7)
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
    }
  }
}
</script>

<style lang="scss">
.transactions-chart {
  &__canvas {
    height: 220px;
  }
}
</style>
