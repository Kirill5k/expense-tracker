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
      required: true
    },
    windowHeight: {
      type: Number,
      required: true
    },
    categoryBreakdown: {
      type: Array,
      required: true
    },
    currency: {
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
        tooltip: {
          trigger: 'item',
          formatter: `{b}: ${this.currency.symbol}{c} ({d}%)`,
          confine: true,
          borderWidth: 0,
          padding: 4,
          className: 'text-subtitle-2'
        },
        series: [
          {
            zlevel: 10,
            name: 'Categories Breakdown',
            type: 'pie',
            radius: '75%',
            center: ['50%', '50%'],
            data: this.categoryBreakdown.map(c => ({ value: c.total, name: c.name, icon: c.icon, color: c.color })),
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
  },
  methods: {
  }
}
</script>

<style lang="scss">
.categories-chart {

}
</style>
