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
      if (this.displayDate.index < 0) {
        return (Number(this.totalAmount) - Number(this.totalSpent(this.previousItems))).toFixed(2)
      } else if (this.displayDate.index === 0) {
        const currentGroup = this.getDateGroup(new Date())
        const currentSpend = this.totalSpent(this.currentItems.filter(tx => this.getItemGroup(tx) <= currentGroup))
        const previousSpend = this.totalSpent(this.previousItems.filter(tx => this.getItemGroup(tx) <= currentGroup))
        return (Number(currentSpend) - Number(previousSpend)).toFixed(2)
      } else {
        return 0
      }
    },
    subtext () {
      if (this.displayDate.index > 0 || this.spendingDifference === '0.00') {
        return 'Total spend'
      } else if (this.spendingDifference < 0) {
        return `Total spend {up|↓}{a|${this.currency.symbol}${Math.abs(this.spendingDifference)}}`
      } else {
        return `Total spend {down|↑}{b|${this.currency.symbol}${Math.abs(this.spendingDifference)}}`
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
  &__canvas {
    height: 220px;
  }
}
</style>
