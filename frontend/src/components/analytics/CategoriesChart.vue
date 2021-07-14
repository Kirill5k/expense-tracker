<template>
  <div class="categories-chart">
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
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'

use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
])

export default {
  name: 'CategoriesChart',
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
    option () {
      return {
        title: {
          text: 'Traffic Sources',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b} : {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: [
            'Direct',
            'Email',
            'Ad Networks',
            'Video Ads',
            'Search Engines'
          ]
        },
        series: [
          {
            name: 'Traffic Sources',
            type: 'pie',
            radius: '55%',
            center: ['50%', '60%'],
            data: [
              { value: 335, name: 'Direct' },
              { value: 310, name: 'Email' },
              { value: 234, name: 'Ad Networks' },
              { value: 135, name: 'Video Ads' },
              { value: 1548, name: 'Search Engines' }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
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
.categories-chart {

}
</style>
