<template>
  <div class="demo-chart">
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
import { LegendComponent } from 'echarts/components'

use([
  CanvasRenderer,
  PieChart,
  LegendComponent
])

const TEST_DATA = [
  {
    value: 1009.99,
    name: 'General',
    icon: 'mdi-cash',
    color: '#AA00FF'
  },
  {
    value: 1000,
    name: 'Restaraunts',
    icon: 'mdi-silverware',
    color: '#FFC400'
  },
  {
    value: 251,
    name: 'Transfer',
    icon: 'mdi-send',
    color: '#6200EA'
  },
  {
    value: 200,
    name: 'Fuel',
    icon: 'mdi-gas-station',
    color: '#D50000'
  },
  {
    value: 99.99,
    name: 'Kids',
    icon: 'mdi-baby-carriage',
    color: '#64DD17'
  },
  {
    value: 99.9,
    name: 'Groceries',
    icon: 'mdi-cart',
    color: '#304FFE'
  },
  {
    value: 18.75,
    name: 'Health',
    icon: 'mdi-pill',
    color: '#00E5FF'
  },
  {
    value: 11,
    name: 'Shopping',
    icon: 'mdi-shopping',
    color: '#C51162'
  },
  {
    value: 10.14,
    name: 'Transport',
    icon: 'mdi-bus',
    color: '#FF6D00'
  },
  {
    value: 8.88,
    name: 'Utilities',
    icon: 'mdi-home',
    color: '#AEEA00'
  }
]

export default {
  name: 'Demo',
  components: {
    VChart
  },
  provide: {
    [THEME_KEY]: 'light'
  },
  props: {
    dark: {
      type: Boolean,
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
        return 200
      } else if (this.windowHeight < 700) {
        return 300
      } else {
        return 400
      }
    },
    option () {
      return {
        series: [
          {
            zlevel: 10,
            name: 'Demo Breakdown',
            type: 'pie',
            radius: '75%',
            center: ['50%', '50%'],
            data: TEST_DATA,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            label: {
              color: this.dark ? 'white' : '#424242',
              fontSize: 10,
              position: 'outer',
              alignTo: 'none',
              edgeDistance: '0%',
              bleedMargin: 0
            },
            itemStyle: {
              color: ({ data }) => data.color
            }
          }
        ]
      }
    }
  }
}
</script>

<style lang="scss">
.demo-chart {

}
</style>
